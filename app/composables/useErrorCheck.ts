export const useErrorCheck = () => {
  const extractErrorMessage = (err: unknown) => {
    if (err && typeof err === 'object' && 'statusMessage' in err) {
      return String(err.statusMessage)
    }
    if (err instanceof Error) {
      return err.message
    }
    return 'Unknown Error.'
  }

  const isAuthError = (err: unknown) => {
    // check for 401 status code
    if (
      err &&
      typeof err === 'object' &&
      'statusCode' in err &&
      err.statusCode === 401
    ) {
      return true
    }
    return false
  }
  return { extractErrorMessage, isAuthError }
}
