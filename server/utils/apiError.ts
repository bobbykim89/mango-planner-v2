import type { ApiErrorCode, ApiFailure, ApiFieldError } from '#shared/types'
import { ZodError } from 'zod'

/** An error the API turns into a failure envelope. */
export class ApiError extends Error {
  status: number
  code: ApiErrorCode
  fields?: ApiFieldError[]
  headers?: Record<string, string>

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    fields?: ApiFieldError[],
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fields = fields
  }
}

const catalog: Record<ApiErrorCode, { status: number; message: string }> = {
  VALIDATION_FAILED: {
    status: 400,
    message: 'Some fields need your attention.',
  },
  BAD_REQUEST: {
    status: 400,
    message: "We couldn't read that request. Please try again.",
  },
  INVALID_ID: { status: 400, message: "That link or ID isn't valid." },
  AUTH_TOKEN_MISSING: { status: 401, message: 'Please sign in to continue.' },
  AUTH_TOKEN_INVALID: {
    status: 401,
    message: 'Your session has expired. Please sign in again.',
  },
  AUTH_INVALID_CREDENTIALS: {
    status: 401,
    message: "That email or password isn't right.",
  },
  FORBIDDEN: { status: 403, message: "You don't have access to this item." },
  NOT_FOUND: {
    status: 404,
    message: "We couldn't find what you were looking for.",
  },
  USER_NOT_FOUND: {
    status: 404,
    message: "We couldn't find your account. Please sign in again.",
  },
  PROFILE_NOT_FOUND: {
    status: 404,
    message: "You don't have a profile yet. Please create one first.",
  },
  PLAN_NOT_FOUND: {
    status: 404,
    message: "This plan doesn't exist or was deleted.",
  },
  EMAIL_IN_USE: {
    status: 409,
    message: 'An account with this email already exists.',
  },
  PROFILE_EXISTS: { status: 409, message: 'You already have a profile.' },
  RESET_TOKEN_INVALID: {
    status: 400,
    message:
      'This reset link is invalid or has expired. Please request a new one.',
  },
  PAYLOAD_TOO_LARGE: {
    status: 413,
    message: 'That file is too large. Please choose one under 5 MB.',
  },
  UNSUPPORTED_MEDIA_TYPE: {
    status: 415,
    message: 'Please upload a JPEG or PNG image.',
  },
  RATE_LIMITED: {
    status: 429,
    message: 'Too many attempts. Please wait a few minutes and try again.',
  },
  UPSTREAM_ERROR: {
    status: 502,
    message: "A service we depend on isn't responding. Please try again later.",
  },
  INTERNAL_ERROR: {
    status: 500,
    message: 'Something went wrong on our side. Please try again.',
  },
}

type ApiErrorFactory = (message?: string, fields?: ApiFieldError[]) => ApiError

/** One factory per error code, with that code's status and default message. */
export const apiError = Object.fromEntries(
  (Object.keys(catalog) as ApiErrorCode[]).map((code) => [
    code,
    (message?: string, fields?: ApiFieldError[]) =>
      new ApiError(
        catalog[code].status,
        code,
        message ?? catalog[code].message,
        fields,
      ),
  ]),
) as Record<ApiErrorCode, ApiErrorFactory>

const zodFields = (err: ZodError): ApiFieldError[] => {
  const seen = new Map<string, string>()
  for (const issue of err.issues) {
    const field = issue.path.map(String).join('.') || 'body'
    if (!seen.has(field)) seen.set(field, issue.message)
  }
  return [...seen].map(([field, message]) => ({ field, message }))
}

const isCastError = (err: unknown): boolean =>
  !!err &&
  typeof err === 'object' &&
  (err as { name?: string }).name === 'CastError'

const isBodyParseError = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false
  const e = err as {
    statusCode?: number
    statusMessage?: string
    message?: string
  }
  return (
    e.statusCode === 400 &&
    /body|json/i.test(`${e.statusMessage ?? ''} ${e.message ?? ''}`)
  )
}

/** Maps anything thrown by a handler to a status, failure envelope and headers. */
export const toApiFailure = (
  err: unknown,
): { status: number; body: ApiFailure; headers?: Record<string, string> } => {
  let apiErr: ApiError
  if (err instanceof ApiError) {
    apiErr = err
  } else if (err instanceof ZodError) {
    apiErr = apiError.VALIDATION_FAILED(undefined, zodFields(err))
  } else if (isCastError(err)) {
    apiErr = apiError.INVALID_ID()
  } else if (isBodyParseError(err)) {
    apiErr = apiError.BAD_REQUEST()
  } else {
    console.error('[api] unexpected error:', err)
    apiErr = apiError.INTERNAL_ERROR()
  }
  // a single field error says exactly what's wrong, which matters for forms that only show an alert
  const message =
    apiErr.code === 'VALIDATION_FAILED' &&
    apiErr.message === catalog.VALIDATION_FAILED.message &&
    apiErr.fields?.length === 1
      ? apiErr.fields[0]!.message
      : apiErr.message
  const error: ApiFailure['error'] = { code: apiErr.code, message }
  if (apiErr.fields?.length) error.fields = apiErr.fields
  return {
    status: apiErr.status,
    body: { ok: false, error },
    headers: apiErr.headers,
  }
}
