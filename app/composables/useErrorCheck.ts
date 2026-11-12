export const useErrorCheck = () => {
  const extractErrorMessage = (err: unknown) => {
    if (err instanceof ApiClientError) return err.message
    if (err && typeof err === 'object' && 'statusMessage' in err) {
      return String(err.statusMessage)
    }
    if (err instanceof Error) {
      return err.message
    }
    return 'Unknown Error.'
  }

  // only a missing or invalid session means "signed out"; a wrong password at login doesn't
  const isAuthError = (err: unknown) => {
    if (err instanceof ApiClientError) {
      return (
        err.code === 'AUTH_TOKEN_MISSING' || err.code === 'AUTH_TOKEN_INVALID'
      )
    }
    return (
      !!err &&
      typeof err === 'object' &&
      'statusCode' in err &&
      err.statusCode === 401
    )
  }
  return { extractErrorMessage, isAuthError }
}
