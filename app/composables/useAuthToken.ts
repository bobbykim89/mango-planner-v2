import type { CookieRef } from '#app'
import { useCookie, useNuxtApp } from '#imports'

declare module '#app' {
  interface NuxtApp {
    _authTokenCookie?: CookieRef<string | null | undefined>
  }
}

/**
 * The access_token cookie, shared by everything in this app instance.
 * Separate useCookie refs for the same cookie only sync asynchronously, so the
 * stores and useApi must read the same ref: otherwise a request sent right
 * after login goes out without the new token.
 */
export const useAuthToken = () => {
  const nuxtApp = useNuxtApp()
  nuxtApp._authTokenCookie ??= useCookie<string | null | undefined>(
    'access_token',
    {
      maxAge: 604800,
      sameSite: true,
    },
  )
  return nuxtApp._authTokenCookie
}
