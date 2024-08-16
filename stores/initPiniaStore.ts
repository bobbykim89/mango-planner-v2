import { defineStore } from 'pinia'
import { ref } from 'vue'
import { usePlanStore, useProfileStore, useUserStore } from './'

export const useInitPiniaStore = defineStore('init', () => {
  const userStore = useUserStore()
  const planStore = usePlanStore()
  const profileStore = useProfileStore()
  // state
  const loading = ref<boolean>(true)
  const mounted = ref<boolean>(false)
  // actions
  const initStores = async () => {
    await userStore.getCurrentUser()
    const { isAuthenticated } = storeToRefs(userStore)
    if (isAuthenticated.value === true && loading.value === false) {
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
