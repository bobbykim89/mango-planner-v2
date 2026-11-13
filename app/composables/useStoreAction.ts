import { useAlertStore } from '@/stores/alertStore'
import { useSessionStore } from '@/stores/sessionStore'

export interface StoreActionOptions<T> {
  /** Needs the session cookie: without it, don't call the API and expire the session (unless expireOnAuthError is false). Default true. */
  requireAuth?: boolean
  /** Success alert; a function receives the action's result. */
  success?: string | ((result: T) => string)
  /** Runs first on any failure, e.g. to save a draft or fill field errors. */
  onError?: (err: unknown) => void | Promise<void>
  /** Treat a missing/invalid session as expired: clear everything and go to login. Default true. */
  expireOnAuthError?: boolean
}

export type RunStoreAction = <T>(
  fn: () => Promise<T>,
  opts?: StoreActionOptions<T>,
) => Promise<boolean>

/**
 * Runs a store action body with the shared guard, alerts and error handling.
 * Call it once at the top of a store's setup; actions never throw and
 * resolve to true on success, false otherwise.
 */
export const useStoreAction = (): RunStoreAction => {
  const nuxtApp = useNuxtApp()
  const cookie = useAuthToken()
  const alertStore = useAlertStore()
  const errorCheck = useErrorCheck()

  return async (fn, opts = {}) => {
    if (opts.requireAuth !== false && !cookie.value) {
      // a guest opening the app: nothing to do
      if (opts.expireOnAuthError === false) return false
      // the session ended meanwhile, e.g. signed out in another tab: treat it like the
      // server rejecting the session, so onError keeps the input and the user is told (#30)
      const err = new ApiClientError(401, 'AUTH_TOKEN_MISSING', SESSION_EXPIRED_MESSAGE)
      await opts.onError?.(err)
      await nuxtApp.runWithContext(() => useSessionStore().expire())
      return false
    }
    try {
      const result = await fn()
      if (opts.success) {
        const message =
          typeof opts.success === 'function'
            ? opts.success(result)
            : opts.success
        alertStore.setAlert(message, 'success')
      }
      return true
    } catch (err) {
      await opts.onError?.(err)
      if (opts.expireOnAuthError !== false && errorCheck.isAuthError(err)) {
        // looked up here, not at setup: the session store imports the domain stores
        await nuxtApp.runWithContext(() => useSessionStore().expire())
        return false
      }
      const message = errorCheck.extractErrorMessage(err)
      console.error(message)
      alertStore.setAlert(message)
      return false
    }
  }
}
