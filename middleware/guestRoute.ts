import { storeToRefs } from 'pinia'
import { useInitPiniaStore, useUserStore, useAlertStore } from '@/stores'

export default defineNuxtRouteMiddleware(() => {
  const userStore = useUserStore()
  const initPiniaStore = useInitPiniaStore()
  const alertStore = useAlertStore()
  const { mounted } = storeToRefs(initPiniaStore)
  const { isAuthenticated } = userStore.getCurrentAuthInfo
  // await userStore.getCurrentUser()
  if (mounted.value && isAuthenticated) {
    alertStore.setAlert("Guest only route: redirecting to '/'")
    return navigateTo({ path: '/' })
  }
})
