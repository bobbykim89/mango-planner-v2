import { useAlertStore, useInitPiniaStore, useUserStore } from '@/stores'
import { storeToRefs } from 'pinia'

export default defineNuxtRouteMiddleware(async () => {
  const userStore = useUserStore()
  const initPiniaStore = useInitPiniaStore()
  const alertStore = useAlertStore()
  const { mounted } = storeToRefs(initPiniaStore)
  await userStore.getCurrentUser()
  const { isAuthenticated } = userStore.getCurrentAuthInfo
  if (mounted.value && isAuthenticated) {
    alertStore.setAlert("Guest only route: redirecting to '/'")
    return navigateTo({ path: '/' })
  }
})
