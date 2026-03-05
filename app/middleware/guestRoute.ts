import { useAlertStore, useInitPiniaStore, useUserStore } from '@/stores'

export default defineNuxtRouteMiddleware(async () => {
  const userStore = useUserStore()
  const initPiniaStore = useInitPiniaStore()
  const alertStore = useAlertStore()
  const { mounted } = storeToRefs(initPiniaStore)
  const { isAuthenticated } = userStore.getCurrentAuthInfo
  if (mounted.value && isAuthenticated) {
    alertStore.setAlert('Guest only route: redirecting to main page')
    return navigateTo({ path: '/' })
  }
})
