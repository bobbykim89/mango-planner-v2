import { storeToRefs } from 'pinia'
import { useInitPiniaStore, useUserStore, useAlertStore } from '@/stores'

export default defineNuxtRouteMiddleware(() => {
  const userStore = useUserStore()
  const initPiniaStore = useInitPiniaStore()
  const alertStore = useAlertStore()
  const { loading } = storeToRefs(initPiniaStore)
  const { isAuthenticated } = userStore.getCurrentAuthInfo
  // await userStore.getCurrentUser()
  if (!loading.value && isAuthenticated) {
    alertStore.setAlert("Guest only route: redirecting to '/'")
    return navigateTo({ path: '/' })
  }
})
