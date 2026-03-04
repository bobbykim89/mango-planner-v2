import { useAlertStore, useUserStore } from '@/stores'

// export default defineNuxtRouteMiddleware(async () => {
//   const userStore = useUserStore()
//   const initPiniaStore = useInitPiniaStore()
//   const alertStore = useAlertStore()
//   const { mounted } = storeToRefs(initPiniaStore)
//   await userStore.getCurrentUser()
//   const { isAuthenticated } = userStore.getCurrentAuthInfo
//   if (mounted.value && !isAuthenticated) {
//     alertStore.setAlert(
//       'Authorized users only route: redirecting to login page'
//     )
//     return navigateTo({ path: '/auth/login' })
//   }
// })

export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return

  const userStore = useUserStore()
  const alertStore = useAlertStore()
  // const { mounted } = storeToRefs(initPiniaStore)
  await userStore.getCurrentUser()
  const { isAuthenticated } = userStore.getCurrentAuthInfo

  if (!isAuthenticated) {
    alertStore.setAlert(
      'Authorized users only route: redirecting to login page',
    )
    return navigateTo({ path: '/auth/login' })
  }
})
