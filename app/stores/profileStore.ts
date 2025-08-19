import type { ProfileInputDark } from '#shared/dto/profile'
import type { ProfileModel } from '#shared/models'
import type { H3Error } from 'h3'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useAlertStore, useUserStore } from './'

export const useProfileStore = defineStore('profile', () => {
  const alertStore = useAlertStore()
  const userStore = useUserStore()
  const cookie = useAuthToken()
  // state
  const userProfile = ref<ProfileModel | null>(null)
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
    try {
      const res = await $fetch<ProfileModel | null>('/api/profile', {
        method: 'GET',
        headers: { Authorization: cookie.value },
      })
      userProfile.value = res
    } catch (error) {
      alertStore.setAlert((error as H3Error).statusMessage!)
      userProfile.value = null
    }
  }
  const postNewUserProfile = async () => {
    const { isAuthenticated } = userStore.getCurrentAuthInfo
    if (!cookie.value || !isAuthenticated) {
      alertStore.setAlert('No user authentication found, please login')
      return
    }
    try {
      await $fetch<ProfileModel>('/api/profile', {
        method: 'POST',
        headers: { Authorization: cookie.value },
      })
      await getCurrentUserProfile()
      alertStore.setAlert('Successfully created user profile!', 'success')
    } catch (error) {
      alertStore.setAlert((error as H3Error).statusMessage!)
    }
  }
  const updateUserProfilePicture = async (payload: FormData) => {
    const { isAuthenticated } = userStore.getCurrentAuthInfo
    if (!cookie.value || !isAuthenticated) {
      alertStore.setAlert('No user authentication found, please login')
      return
    }
    try {
      await $fetch<ProfileModel>('/api/profile/profile-picture', {
        method: 'PUT',
        headers: {
          Authorization: cookie.value,
        },
        body: payload,
      })
      await getCurrentUserProfile()
      alertStore.setAlert('Successfully updated profile picture!', 'success')
    } catch (error) {
      alertStore.setAlert((error as H3Error).statusMessage!)
    }
  }
  const updateUserPlansOrder = async (payload: { plansOrder: string[] }) => {
    const { isAuthenticated } = userStore.getCurrentAuthInfo
    if (!cookie.value || !isAuthenticated) {
      alertStore.setAlert('No user authentication found, please login')
      return
    }
    try {
      const res = await $fetch<ProfileModel>('/api/profile/plans-order', {
        method: 'PUT',
        headers: { Authorization: cookie.value },
        body: payload,
      })
      userProfile.value = res
    } catch (error) {
      alertStore.setAlert((error as H3Error).statusMessage!)
    }
  }
  const toggleUserDarkMode = async (payload: ProfileInputDark) => {
    const { isAuthenticated } = userStore.getCurrentAuthInfo
    if (!cookie.value || !isAuthenticated) {
      alertStore.setAlert('No user authentication found, please login')
      return
    }
    try {
      await $fetch<ProfileModel>('/api/profile/dark', {
        method: 'PUT',
        headers: { Authorization: cookie.value },
        body: payload,
      })
      await getCurrentUserProfile()
      alertStore.setAlert(
        `Darkmode ${userProfile.value?.dark ? 'enabled' : 'disabled'}`,
        'success'
      )
    } catch (error) {
      alertStore.setAlert((error as H3Error).statusMessage!)
    }
  }
  const clearProfileData = () => {
    userProfile.value = null
  }
  return {
    userProfile,
    getPlansOrder,
    getCurrentUserProfile,
    postNewUserProfile,
    updateUserProfilePicture,
    updateUserPlansOrder,
    toggleUserDarkMode,
    clearProfileData,
  }
})
