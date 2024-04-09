import { storeToRefs } from 'pinia'
import { useInitPiniaStore, useUserStore, useAlertStore } from '@/stores'

export default defineNuxtRouteMiddleware(() => {
  const userStore = useUserStore()
  const initPiniaStore = useInitPiniaStore()
  const alertStore = useAlertStore()
  const { mounted } = storeToRefs(initPiniaStore)
  const { isAuthenticated } = userStore.getCurrentAuthInfo
  if (mounted.value && !isAuthenticated) {
    alertStore.setAlert(
      'Authorized users only route: redirecting to login page'
    )
    return navigateTo({ path: '/auth/login' })
  }
})
