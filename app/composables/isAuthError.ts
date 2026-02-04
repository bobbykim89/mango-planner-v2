/**
 * @summary read error message and check if it has to do with authentication
 * @param err
 * @returns {Boolean}
 */

export const isAuthError = (err: unknown) => {
  // check for 401 status code
  if (
    err &&
    typeof err === 'object' &&
    'statusCode' in err &&
    err.statusCode === 401
  ) {
    return true
  }
  // check for auth-related error messages
  if (
    err instanceof Error &&
    err.message.toLowerCase().includes('no user authentication found')
  ) {
    return true
  }
  return false
}
