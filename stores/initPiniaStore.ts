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
    await profileStore.getCurrentUserProfile()
    await planStore.getAllPostByUser()
    loading.value = false
  }
  return { loading, initStores }
})
