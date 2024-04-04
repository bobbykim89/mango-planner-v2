import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore, useAlertStore, useInitPiniaStore } from './'
import { Profile } from '@/server/models'

type ProfileType = InstanceType<typeof Profile>

export const useProfileStore = defineStore('profile', () => {
  const alertStore = useAlertStore()
  const userStore = useUserStore()
  const initPiniaStore = useInitPiniaStore()
  const cookie = useAuthToken()
  const { isAuthenticated } = userStore.getCurrentAuthInfo
  // state
  const userProfile = ref<ProfileType | null>(null)
  // getters
  const getPlansOrder = computed<string[]>(() => {
    if (userProfile.value === null) {
      return []
    }
    return userProfile.value.plansOrder
  })
  // actions
  const getCurrentUserProfile = async () => {
    const { isAuthenticated } = userStore.getCurrentAuthInfo
    if (!cookie.value || !isAuthenticated) {
      alertStore.setAlert('No user authentication found, please login')
      return
    }
    const res = await $fetch<ProfileType | null>('/api/profile', {
      method: 'GET',
      headers: { Authorization: cookie.value },
    })
    initPiniaStore.setLoading(true)
    if (!res) {
      userProfile.value = null
      initPiniaStore.setLoading(false)
      return
    }
    userProfile.value = res
    initPiniaStore.setLoading(false)
  }
  const postNewUserProfile = async () => {
    if (!cookie.value || !isAuthenticated) {
      alertStore.setAlert('No user authentication found, please login')
      return
    }
    const res = await $fetch<ProfileType>('/api/profile', {
      method: 'POST',
      headers: { Authorization: cookie.value },
    })
    initPiniaStore.setLoading(true)
    if (!res) {
      alertStore.setAlert(
        'Failed to get response from server, please try again'
      )
      initPiniaStore.setLoading(false)
      return
    }
    await getCurrentUserProfile()
    initPiniaStore.setLoading(false)
    alertStore.setAlert('Successfully created user profile!')
  }
  const updateUserProfilePicture = async (payload: FormData) => {
    if (!cookie.value || !isAuthenticated) {
      alertStore.setAlert('No user authentication found, please login')
      return
    }
    const res = await $fetch<ProfileType>('/api/profile/profile-picture', {
      method: 'PUT',
      headers: {
        Authorization: cookie.value,
        'Content-Type': 'multipart/form-data',
      },
      body: payload,
    })
    initPiniaStore.setLoading(true)
    if (!res) {
      alertStore.setAlert(
        'Failed to get response from server, please try again'
      )
      initPiniaStore.setLoading(false)
      return
    }
    await getCurrentUserProfile()
    initPiniaStore.setLoading(false)
    alertStore.setAlert('Successfully updated profile picture!')
  }
  const updateUserPlansOrder = async (payload: { plansOrder: string[] }) => {
    if (!cookie.value || !isAuthenticated) {
      alertStore.setAlert('No user authentication found, please login')
      return
    }
    const res = await $fetch<ProfileType>('/api/profile/plans-order', {
      method: 'PUT',
      headers: { Authorization: cookie.value },
      body: payload,
    })
    initPiniaStore.setLoading(true)
    if (!res) {
      alertStore.setAlert(
        'Failed to get response from server, please try again'
      )
      initPiniaStore.setLoading(false)
      return
    }
    await getCurrentUserProfile()
    initPiniaStore.setLoading(false)
  }
  const toggleUserDarkMode = async (payload: { dark: boolean }) => {
    if (!cookie.value || !isAuthenticated) {
      alertStore.setAlert('No user authentication found, please login')
      return
    }
    const res = await $fetch<ProfileType>('/api/profile/dark', {
      method: 'PUT',
      headers: { Authorization: cookie.value },
      body: payload,
    })
    initPiniaStore.setLoading(true)
    if (!res) {
      alertStore.setAlert(
        'Failed to get response from server, please try again'
      )
      initPiniaStore.setLoading(false)
      return
    }
    await getCurrentUserProfile()
    initPiniaStore.setLoading(false)
    alertStore.setAlert(
      `Darkmode ${userProfile.value?.dark ? 'enabled' : 'disabled'}`
    )
  }
  return {
    userProfile,
    getPlansOrder,
    getCurrentUserProfile,
    postNewUserProfile,
    updateUserProfilePicture,
    updateUserPlansOrder,
    toggleUserDarkMode,
  }
})
