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
  return false
}
