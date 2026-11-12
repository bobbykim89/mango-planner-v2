import type { ApiErrorCode, ApiFieldError } from '#shared/types'

export type ApiClientErrorCode = ApiErrorCode | 'NETWORK_ERROR' | 'UNKNOWN'

/** An API failure as the client sees it: status, code, user-facing message and field errors. */
export class ApiClientError extends Error {
  status: number
  code: ApiClientErrorCode
  fields: ApiFieldError[]

  constructor(
    status: number,
    code: ApiClientErrorCode,
    message: string,
    fields: ApiFieldError[] = [],
  ) {
    super(message)
    this.name = 'ApiClientError'
    this.status = status
    this.code = code
    this.fields = fields
  }
}

const NETWORK_MESSAGE =
  "Can't reach the server. Check your connection and try again."
const UNKNOWN_MESSAGE = 'Something went wrong. Please try again.'

/** Converts whatever $fetch threw into an ApiClientError. */
export const toApiClientError = (err: unknown): ApiClientError => {
  if (err instanceof ApiClientError) return err
  const e = (err ?? {}) as {
    data?: any
    statusCode?: number
    status?: number
    statusMessage?: string
  }
  const status = e.statusCode ?? e.status ?? 0
  const data = e.data
  if (data && data.ok === false && data.error) {
    return new ApiClientError(
      status,
      data.error.code,
      data.error.message,
      data.error.fields ?? [],
    )
  }
  if (!status) return new ApiClientError(0, 'NETWORK_ERROR', NETWORK_MESSAGE)
  // pre-envelope error shape (routes not migrated yet)
  const message = data?.statusMessage ?? e.statusMessage ?? UNKNOWN_MESSAGE
  return new ApiClientError(
    status,
    status === 401 ? 'AUTH_TOKEN_INVALID' : 'UNKNOWN',
    message,
  )
}

/** Field errors keyed by field name (empty unless it's a validation error). */
export const fieldMap = (err: unknown): Record<string, string> =>
  err instanceof ApiClientError
    ? Object.fromEntries(err.fields.map((f) => [f.field, f.message]))
    : {}
