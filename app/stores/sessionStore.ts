import { defineStore, storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useAlertStore } from './alertStore'
import { usePlanStore } from './planStore'
import { useProfileStore } from './profileStore'
import { useUserStore } from './userStore'

/**
 * Owns the session across stores: startup loading, logout and expiry.
 * The only store that uses the other domain stores.
 */
export const useSessionStore = defineStore('session', () => {
  const cookie = useAuthToken()
  const alertStore = useAlertStore()
  const userStore = useUserStore()
  const profileStore = useProfileStore()
  const planStore = usePlanStore()
  // state
  const loading = ref<boolean>(true)
  const mounted = ref<boolean>(false)
  let expiring = false
  // actions
  const init = async () => {
    // runs on the server too: the access_token cookie comes with the request, so
    // server-side route middleware and rendering see the real auth state (#18)
    await userStore.getCurrentUser()
    const { isAuthenticated } = storeToRefs(userStore)
    if (isAuthenticated.value === true) {
      await profileStore.getCurrentUserProfile()
      await planStore.getAllPostByUser()
    }
    loading.value = false
    mounted.value = true
  }
  /** Signs out on this device. The caller handles navigation. */
  const clearAll = () => {
    cookie.value = null
    userStore.clear()
    profileStore.clear()
    planStore.clear()
  }
  const logout = () => {
    clearAll()
    alertStore.setAlert('Logout Successful!', 'success')
  }
  /** The server rejected the session: clear everything, explain, go to login (once). */
  const expire = async (message: string) => {
    if (expiring) return
    expiring = true
    try {
      clearAll()
      alertStore.setAlert(message)
      await navigateTo('/auth/login')
    } finally {
      expiring = false
    }
  }
  return { loading, mounted, init, clearAll, logout, expire }
})
