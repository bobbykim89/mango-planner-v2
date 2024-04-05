import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useUserStore, usePlanStore, useProfileStore } from './'

export const useInitPiniaStore = defineStore('init', () => {
  const userStore = useUserStore()
  const planStore = usePlanStore()
  const profileStore = useProfileStore()
  // state
  const loading = ref<boolean>(true)
  // actions
  const initStores = async () => {
    await userStore.getCurrentUser()
    const { isAuthenticated } = userStore.getCurrentAuthInfo
    if (isAuthenticated && loading.value === false) {
      console.log('call profile')
      await profileStore.getCurrentUserProfile()
      console.log('finish calling profile, calling plans')
      await planStore.getAllPostByUser()
      console.log('finish calling plans, loading complete')
    }
    loading.value = false
  }
  const setLoading = (value: boolean) => {
    loading.value = value
  }
  return { loading, initStores, setLoading }
})
