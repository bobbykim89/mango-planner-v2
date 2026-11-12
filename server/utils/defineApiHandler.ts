import type { ApiSuccess } from '#shared/types'
import {
  defineEventHandler,
  setResponseHeaders,
  setResponseStatus,
  type H3Event,
} from 'h3'

// Replaced by the union of limiter names when rate limiting is added.
export type RateLimitName = string

export interface ApiHandlerOptions<T> {
  /** Require a valid session token (sets e.context.user). */
  auth?: boolean
  /** Rate limiters to apply before anything else. */
  rateLimit?: RateLimitName | RateLimitName[]
  handler: (e: H3Event) => Promise<T> | T
}

/** Wraps a controller method: rate limit, auth, then the { ok, data } envelope or a failure envelope. */
export const defineApiHandler = <T>(options: ApiHandlerOptions<T>) =>
  defineEventHandler(
    async (
      e,
    ): Promise<ApiSuccess<T> | ReturnType<typeof toApiFailure>['body']> => {
      try {
        if (options.auth) requireAuth(e)
        const data = await options.handler(e)
        return { ok: true, data: (data ?? null) as T }
      } catch (err) {
        const failure = toApiFailure(err)
        setResponseStatus(e, failure.status)
        if (failure.headers) setResponseHeaders(e, failure.headers)
        return failure.body
      }
    },
  )
