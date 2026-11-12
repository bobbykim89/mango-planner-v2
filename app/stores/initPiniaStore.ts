import { defineStore } from 'pinia'
import { ref } from 'vue'
import { usePlanStore } from './planStore'
import { useProfileStore } from './profileStore'
import { useUserStore } from './userStore'

export const useInitPiniaStore = defineStore('init', () => {
  const userStore = useUserStore()
  const planStore = usePlanStore()
  const profileStore = useProfileStore()
  // state
  const loading = ref<boolean>(true)
  const mounted = ref<boolean>(false)
  // actions
  const initStores = async () => {
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
  const setLoading = (value: boolean) => {
    loading.value = value
  }
  return { loading, mounted, initStores, setLoading }
})
