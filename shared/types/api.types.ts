/** Every error code the API can return. */
export type ApiErrorCode =
  | 'VALIDATION_FAILED'
  | 'BAD_REQUEST'
  | 'INVALID_ID'
  | 'AUTH_TOKEN_MISSING'
  | 'AUTH_TOKEN_INVALID'
  | 'AUTH_INVALID_CREDENTIALS'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'USER_NOT_FOUND'
  | 'PROFILE_NOT_FOUND'
  | 'PLAN_NOT_FOUND'
  | 'EMAIL_IN_USE'
  | 'PROFILE_EXISTS'
  | 'RESET_TOKEN_INVALID'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'RATE_LIMITED'
  | 'UPSTREAM_ERROR'
  | 'INTERNAL_ERROR'

export interface ApiFieldError {
  field: string
  message: string
}

export interface ApiSuccess<T> {
  ok: true
  data: T
}

export interface ApiFailure {
  ok: false
  error: {
    code: ApiErrorCode
    message: string
    fields?: ApiFieldError[]
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure
