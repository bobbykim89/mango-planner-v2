import { useAlertStore, useSessionStore, useUserStore } from '@/stores'

export default defineNuxtRouteMiddleware(async () => {
  const userStore = useUserStore()
  const sessionStore = useSessionStore()
  const alertStore = useAlertStore()
  const { mounted } = storeToRefs(sessionStore)
  const { isAuthenticated } = storeToRefs(userStore)
  if (mounted.value && isAuthenticated.value) {
    alertStore.setAlert('Guest only route: redirecting to main page')
    return navigateTo({ path: '/' })
  }
})
