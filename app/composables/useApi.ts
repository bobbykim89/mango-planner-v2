import type { ApiSuccess } from '#shared/types'

type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface ApiRequestOptions {
  method?: ApiMethod
  body?: Record<string, unknown> | FormData | unknown[]
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
    // routes not yet migrated still return their payload directly
    return isSuccessEnvelope<T>(res) ? res.data : (res as T)
  }
}
