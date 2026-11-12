import type { ApiSuccess } from '#shared/types'
import type { RateLimitName } from './rateLimit'
import {
  defineEventHandler,
  setResponseHeaders,
  setResponseStatus,
  type H3Event,
} from 'h3'

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
        const limiters = options.rateLimit
          ? ([] as RateLimitName[]).concat(options.rateLimit)
          : []
        for (const name of limiters) await hitRateLimit(e, name)
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
