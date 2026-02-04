/**
 * @summary check error and return its error message
 * @param err
 * @returns {String}
 */

export const extractErrorMessage = (err: unknown) => {
  if (err && typeof err === 'object' && 'statusMessage' in err) {
    return String(err.statusMessage)
  }
  if (err instanceof Error) {
    return err.message
  }
  return 'Unknown Error.'
}
