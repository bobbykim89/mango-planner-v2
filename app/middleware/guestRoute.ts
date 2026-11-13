import { useAlertStore, useSessionStore, useUserStore } from '@/stores'

export default defineNuxtRouteMiddleware(async () => {
  const userStore = useUserStore()
  const sessionStore = useSessionStore()
  const alertStore = useAlertStore()
  const { mounted } = storeToRefs(sessionStore)
  const { isAuthenticated } = userStore.getCurrentAuthInfo
  if (mounted.value && isAuthenticated) {
    alertStore.setAlert('Guest only route: redirecting to main page')
    return navigateTo({ path: '/' })
  }
})
