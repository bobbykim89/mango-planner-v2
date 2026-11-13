import { useAlertStore } from '@/stores/alertStore'
import { useSessionStore } from '@/stores/sessionStore'

export interface StoreActionOptions<T> {
  /** Return false without calling the API when there's no session cookie. Default true. */
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
    if (opts.requireAuth !== false && !cookie.value) return false
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
      const message = errorCheck.extractErrorMessage(err)
      if (opts.expireOnAuthError !== false && errorCheck.isAuthError(err)) {
        // looked up here, not at setup: the session store imports the domain stores
        await nuxtApp.runWithContext(() => useSessionStore().expire(message))
        return false
      }
      console.error(message)
      alertStore.setAlert(message)
      return false
    }
  }
}
