import { RateLimit } from '#shared/models'
import { getRequestIP, readBody, type H3Event } from 'h3'

export type RateLimitName =
  | 'login'
  | 'signup'
  | 'sendTokenIp'
  | 'sendTokenEmail'
  | 'resetPassword'

/** Requests allowed per window. Stored in MongoDB because serverless instances share no memory. */
export const RATE_LIMITS: Record<
  RateLimitName,
  { max: number; windowSec: number }
> = {
  login: { max: 10, windowSec: 15 * 60 },
  signup: { max: 5, windowSec: 60 * 60 },
  sendTokenIp: { max: 5, windowSec: 60 * 60 },
  sendTokenEmail: { max: 3, windowSec: 60 * 60 },
  resetPassword: { max: 10, windowSec: 60 * 60 },
}

const clientKey = async (
  e: H3Event,
  name: RateLimitName,
): Promise<string | null> => {
  if (name === 'sendTokenEmail') {
    let body: unknown
    try {
      body = await readBody(e)
    } catch {
      return null
    }
    const email = (body as { email?: unknown } | null)?.email
    return typeof email === 'string' && email.trim()
      ? email.trim().toLowerCase()
      : null
  }
  return getRequestIP(e, { xForwardedFor: true }) ?? 'unknown'
}

/** Counts one request against the limiter; throws RATE_LIMITED (with Retry-After) when over. */
export const hitRateLimit = async (
  e: H3Event,
  name: RateLimitName,
): Promise<void> => {
  const id = await clientKey(e, name)
  if (id === null) return
  const { max, windowSec } = RATE_LIMITS[name]
  const now = new Date()
  const windowEnd = new Date(now.getTime() + windowSec * 1000)
  const live = { $gt: ['$resetAt', now] }
  // one atomic update: count within the live window, or start a new window
  const doc = await RateLimit.findOneAndUpdate(
    { key: `${name}:${id}` },
    [
      {
        $set: {
          count: { $cond: [live, { $add: ['$count', 1] }, 1] },
          resetAt: { $cond: [live, '$resetAt', windowEnd] },
        },
      },
    ],
    { upsert: true, returnDocument: 'after', updatePipeline: true },
  )
  if (doc && doc.count > max) {
    const err = apiError.RATE_LIMITED()
    err.headers = {
      'Retry-After': String(
        Math.max(1, Math.ceil((doc.resetAt.getTime() - now.getTime()) / 1000)),
      ),
    }
    throw err
  }
}
