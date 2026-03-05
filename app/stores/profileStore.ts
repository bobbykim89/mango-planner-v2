import type { ProfileInputDark } from '#shared/dto/profile'
import type { ProfileDto } from '#shared/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useAlertStore } from './alertStore'
import { useUserStore } from './userStore'

export const useProfileStore = defineStore('profile', () => {
  const errorCheck = useErrorCheck()
  const alertStore = useAlertStore()
  const userStore = useUserStore()
  const cookie = useAuthToken()
  // state
  const userProfile = ref<ProfileDto | null>(null)
  const darkMode = ref<boolean>(false)
  // getters
  const getPlansOrder = computed<string[]>(() => {
    if (userProfile.value === null) {
      return []
    }
    return userProfile.value.plansOrder
  })
  // actions
  const getCurrentUserProfile = async () => {
    try {
      const { isAuthenticated } = userStore.getCurrentAuthInfo
      if (!cookie.value || !isAuthenticated) return

      const res = await $fetch<ProfileDto | null>('/api/profile', {
        method: 'GET',
        headers: { Authorization: cookie.value },
      })
      if (res) {
        userProfile.value = res
        darkMode.value = userProfile.value?.dark
      }
    } catch (error) {
      handleProfileError(error)
    }
  }
  const postNewUserProfile = async () => {
    try {
      const { isAuthenticated } = userStore.getCurrentAuthInfo
      if (!cookie.value || !isAuthenticated) return

      await $fetch<ProfileDto>('/api/profile', {
        method: 'POST',
        headers: { Authorization: cookie.value },
      })
      await getCurrentUserProfile()
      alertStore.setAlert('Successfully created user profile!', 'success')
    } catch (error) {
      handleProfileError(error)
    }
  }
  const updateUserProfilePicture = async (payload: FormData) => {
    try {
      const { isAuthenticated } = userStore.getCurrentAuthInfo
      if (!cookie.value || !isAuthenticated) return

      await $fetch<ProfileDto>('/api/profile/profile-picture', {
        method: 'PUT',
        headers: {
          Authorization: cookie.value,
        },
        body: payload,
      })
      await getCurrentUserProfile()
      alertStore.setAlert('Successfully updated profile picture!', 'success')
    } catch (error) {
      handleProfileError(error)
    }
  }
  const updateUserPlansOrder = async (payload: { plansOrder: string[] }) => {
    try {
      const { isAuthenticated } = userStore.getCurrentAuthInfo
      if (!cookie.value || !isAuthenticated) return

      const res = await $fetch<ProfileDto>('/api/profile/plans-order', {
        method: 'PUT',
        headers: { Authorization: cookie.value },
        body: payload,
      })
      userProfile.value = res
    } catch (error) {
      handleProfileError(error)
    }
  }
  const toggleUserDarkMode = async (payload: ProfileInputDark) => {
    try {
      const { isAuthenticated } = userStore.getCurrentAuthInfo
      if (!cookie.value || !isAuthenticated) return

      await $fetch<ProfileDto>('/api/profile/dark', {
        method: 'PUT',
        headers: { Authorization: cookie.value },
        body: payload,
      })
      await getCurrentUserProfile()
      alertStore.setAlert(
        `Darkmode ${userProfile.value?.dark ? 'enabled' : 'disabled'}`,
        'success',
      )
    } catch (error) {
      handleProfileError(error)
    }
  }
  const clearProfileData = () => {
    userProfile.value = null
    darkMode.value = false
  }
  const handleProfileError = (err: unknown) => {
    const errorMessage: string = errorCheck.extractErrorMessage(err)
    const checkAuthError: boolean = errorCheck.isAuthError(err)

    if (checkAuthError) {
      userProfile.value = null
      darkMode.value = false
    }

    console.error(errorMessage)
    alertStore.setAlert(errorMessage)
  }
  return {
    userProfile,
    darkMode,
    getPlansOrder,
    getCurrentUserProfile,
    postNewUserProfile,
    updateUserProfilePicture,
    updateUserPlansOrder,
    toggleUserDarkMode,
    clearProfileData,
  }
})
