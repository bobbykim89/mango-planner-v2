import { useAlertStore, useInitPiniaStore, useUserStore } from '@/stores'
import { storeToRefs } from 'pinia'

export default defineNuxtRouteMiddleware(async () => {
  const userStore = useUserStore()
  const initPiniaStore = useInitPiniaStore()
  const alertStore = useAlertStore()
  const { mounted } = storeToRefs(initPiniaStore)
  await userStore.getCurrentUser()
  const { isAuthenticated } = userStore.getCurrentAuthInfo
  if (mounted.value && !isAuthenticated) {
    alertStore.setAlert(
      'Authorized users only route: redirecting to login page'
    )
    return navigateTo({ path: '/auth/login' })
  }
})
