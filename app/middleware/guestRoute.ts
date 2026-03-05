import { useAlertStore, useInitPiniaStore, useUserStore } from '@/stores'

export default defineNuxtRouteMiddleware(async () => {
  const userStore = useUserStore()
  const initPiniaStore = useInitPiniaStore()
  const alertStore = useAlertStore()
  const { mounted } = storeToRefs(initPiniaStore)
  // await userStore.getCurrentUser()
  const { isAuthenticated } = userStore.getCurrentAuthInfo
  if (mounted.value && isAuthenticated) {
    alertStore.setAlert('Guest only route: redirecting to main page')
    return navigateTo({ path: '/' })
  }
})

// export default defineNuxtRouteMiddleware(async () => {
//   const userStore = useUserStore()
//   const initPiniaStore = useInitPiniaStore()
//   const alertStore = useAlertStore()
//   const { mounted } = storeToRefs(initPiniaStore)
//   // await userStore.getCurrentUser()
//   const { isAuthenticated } = userStore.getCurrentAuthInfo

//   if (isAuthenticated) {
//     alertStore.setAlert('Guest only route: redirecting to main page')
//     return await navigateTo({ path: '/' })
//   }
// })
