import type { ApiSuccess } from '#shared/types'

type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface ApiRequestOptions {
  method?: ApiMethod
  // any JSON-serialisable object (interfaces such as PlanInput aren't assignable to Record<string, unknown>) or FormData
  body?: object
  query?: Record<string, string | number | boolean | undefined>
}

const isSuccessEnvelope = <T>(res: unknown): res is ApiSuccess<T> =>
  !!res &&
  typeof res === 'object' &&
  (res as { ok?: unknown }).ok === true &&
  'data' in res

/**
 * Calls the API with the session token and returns `data` from the
 * `{ ok, data }` envelope; failures throw an ApiClientError.
 */
export const useApi = () => {
  const cookie = useAuthToken()
  return async <T>(url: string, opts: ApiRequestOptions = {}): Promise<T> => {
    const headers: Record<string, string> = {}
    if (cookie.value) headers.Authorization = cookie.value
    let res: unknown
    try {
      res = await $fetch<unknown>(url, {
        method: opts.method ?? 'GET',
        body: opts.body,
        query: opts.query,
        headers,
      })
    } catch (err) {
      throw toApiClientError(err)
    }
    if (!isSuccessEnvelope<T>(res)) {
      throw new ApiClientError(
        200,
        'UNKNOWN',
        'Something went wrong. Please try again.',
      )
    }
    return res.data
  }
}
