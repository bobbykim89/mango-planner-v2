import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCookie, useFetch } from '#imports'
import { useUserStore, useAlertStore } from './'
import { Profile } from '@/server/models'

type ProfileType = InstanceType<typeof Profile>

export const useProfileStore = defineStore('profile', () => {
  const alertStore = useAlertStore()
  const userStore = useUserStore()
  const cookie = useAuthToken()
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
    try {
      const { isAuthenticated, accessToken } = userStore.getCurrentAuthInfo
      if (!accessToken || !isAuthenticated) {
        alertStore.setAlert('No user authentication found, please login')
        return
      }
      // const res: ProfileType = await $fetch('/api/profile', {
      //   method: 'GET',
      //   headers: { Authorization: cookie.value },
      // })
      const { data: res, error } = await useFetch<ProfileType>('/api/profile', {
        method: 'GET',
        headers: { Authorization: accessToken },
      })
      if (!res.value || error.value !== null) {
        userProfile.value = null
        return
      }
      userProfile.value = res.value
    } catch (error) {
      alertStore.setAlert('Authentication error: Cannot bring user profile')
      userProfile.value = null
    }
  }
  const postNewUserProfile = async () => {
    try {
      const { isAuthenticated, accessToken } = userStore.getCurrentAuthInfo
      if (!accessToken || !isAuthenticated) {
        alertStore.setAlert('No user authentication found, please login')
        return
      }
      // const res: ProfileType = await $fetch('/api/profile', {
      //   method: 'POST',
      //   headers: { Authorization: cookie.value },
      // })
      const { data: res, error } = await useFetch<ProfileType>('/api/profile', {
        method: 'POST',
        headers: { Authorization: accessToken },
      })
      if (!res.value || error.value !== null) {
        alertStore.setAlert(
          'Failed to get response from server, please try again'
        )
        return
      }
      await getCurrentUserProfile()
      alertStore.setAlert('Successfully created user profile!')
    } catch (error) {
      alertStore.setAlert(
        'Failed to create user profile, please try again later.'
      )
      userProfile.value = null
    }
  }
  const updateUserProfilePicture = async (payload: FormData) => {
    try {
      const { isAuthenticated, accessToken } = userStore.getCurrentAuthInfo
      if (!accessToken || !isAuthenticated) {
        alertStore.setAlert('No user authentication found, please login')
        return
      }
      // const res: ProfileType = await $fetch('/api/profile/profile-picture', {
      //   method: 'PUT',
      //   headers: {
      //     Authorization: cookie.value,
      //     'Content-Type': 'multipart/form-data',
      //   },
      //   body: payload,
      // })
      const { data: res, error } = await useFetch<ProfileType>(
        '/api/profile/profile-picture',
        {
          method: 'PUT',
          headers: {
            Authorization: accessToken,
            'Content-Type': 'multipart/form-data',
          },
          body: payload,
        }
      )
      if (!res.value || error.value !== null) {
        alertStore.setAlert(
          'Failed to get response from server, please try again'
        )
        return
      }
      await getCurrentUserProfile()
      alertStore.setAlert('Successfully updated profile picture!')
    } catch (error) {
      alertStore.setAlert(
        'Failed to update user profile, please try again later.'
      )
    }
  }
  const updateUserPlansOrder = async (payload: { plansOrder: string[] }) => {
    try {
      const { plansOrder } = payload
      const { isAuthenticated, accessToken } = userStore.getCurrentAuthInfo
      if (!accessToken || !isAuthenticated) {
        alertStore.setAlert('No user authentication found, please login')
        return
      }
      // const res: ProfileType = await $fetch('/api/profile/plans-order', {
      //   method: 'PUT',
      //   body: { plansOrder },
      // })
      const { data: res, error } = await useFetch<ProfileType>(
        '/api/profile/plans-order',
        {
          method: 'PUT',
          headers: { Authorization: accessToken },
          body: { plansOrder },
        }
      )
      if (!res.value || error.value !== null) {
        alertStore.setAlert(
          'Failed to get response from server, please try again'
        )
        return
      }
      await getCurrentUserProfile()
    } catch (error) {
      alertStore.setAlert(
        'Failed to update plans order, please try again later.'
      )
    }
  }
  const toggleUserDarkMode = async (payload: { dark: boolean }) => {
    try {
      const { dark } = payload
      const { isAuthenticated, accessToken } = userStore.getCurrentAuthInfo
      if (!accessToken || !isAuthenticated) {
        alertStore.setAlert('No user authentication found, please login')
        return
      }
      // const res: ProfileType = await $fetch('/api/profile/dark', {
      //   method: 'PUT',
      //   body: { dark },
      // })
      const { data: res, error } = await useFetch<ProfileType>(
        '/api/profile/dark',
        {
          method: 'PUT',
          headers: { Authorization: accessToken },
          body: { dark },
        }
      )
      if (!res.value || error.value !== null) {
        alertStore.setAlert(
          'Failed to get response from server, please try again'
        )
        return
      }
      await getCurrentUserProfile()
      alertStore.setAlert(
        `Darkmode ${userProfile.value?.dark ? 'enabled' : 'disabled'}`
      )
    } catch (error) {
      alertStore.setAlert(
        'Failed to toggle color mode, please try again later.'
      )
    }
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
