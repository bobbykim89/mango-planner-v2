export const useErrorCheck = () => {
  const extractErrorMessage = (err: unknown) => {
    if (err instanceof ApiClientError) return err.message
    if (err instanceof Error) return err.message
    return 'Something went wrong. Please try again.'
  }

  // only a missing or invalid session means "signed out"; a wrong password at login doesn't
  const isAuthError = (err: unknown) =>
    err instanceof ApiClientError &&
    (err.code === 'AUTH_TOKEN_MISSING' || err.code === 'AUTH_TOKEN_INVALID')

  return { extractErrorMessage, isAuthError }
}
