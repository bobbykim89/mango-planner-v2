export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please sign in again.'

/**
 * Where an expired session goes. The reason travels in the URL, not in store
 * state, so it survives a redirect made on the server, whose state never
 * reaches the browser (#31); the login page shows the message.
 */
export const SESSION_EXPIRED_REDIRECT = {
  path: '/auth/login',
  query: { reason: 'expired' },
}
