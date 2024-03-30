import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCookie } from '#imports'
import { useErrorStore, useUserStore } from './'
import { Profile } from '@/server/models'

type ProfileType = InstanceType<typeof Profile>

export const useProfileStore = defineStore('profile', () => {
  const errorStore = useErrorStore()
  const userStore = useUserStore()
  const cookie = useCookie('access_token', {
    maxAge: 604800,
    sameSite: true,
  })
  // state
  const userProfile = ref<ProfileType | null>(null)
  // getters
  // actions
  const getCurrentUserProfile = async () => {
    try {
      const { isAuthenticated } = userStore.getCurrentAuthInfo
      if (!cookie.value || !isAuthenticated) {
        errorStore.setError('No user authentication found, please login')
        return
      }
      const res: ProfileType = await $fetch('/api/profile', {
        method: 'GET',
        headers: { Authorization: cookie.value },
      })
      if (!res) {
        userProfile.value = null
        return
      }
      userProfile.value = res
    } catch (error) {
      errorStore.setError('Authentication error: Cannot bring user profile')
      userProfile.value = null
    }
  }
  const postNewUserProfile = async () => {
    try {
      const { isAuthenticated } = userStore.getCurrentAuthInfo
      if (!cookie.value || !isAuthenticated) {
        errorStore.setError('No user authentication found, please login')
        return
      }
      const res: ProfileType = await $fetch('/api/profile', {
        method: 'POST',
        headers: { Authorization: cookie.value },
      })
      if (!res) {
        errorStore.setError(
          'Failed to get response from server, please try again'
        )
        return
      }
      await getCurrentUserProfile()
    } catch (error) {
      errorStore.setError(
        'Failed to create user profile, please try again later.'
      )
      userProfile.value = null
    }
  }
  const updateUserProfilePicture = async (payload: FormData) => {
    try {
      const { isAuthenticated } = userStore.getCurrentAuthInfo
      if (!cookie.value || !isAuthenticated) {
        errorStore.setError('No user authentication found, please login')
        return
      }
      const res: ProfileType = await $fetch('/api/profile/profile-picture', {
        method: 'PUT',
        headers: {
          Authorization: cookie.value,
          'Content-Type': 'multipart/form-data',
        },
        body: payload,
      })
      if (!res) {
        errorStore.setError(
          'Failed to get response from server, please try again'
        )
        return
      }
      await getCurrentUserProfile()
    } catch (error) {
      errorStore.setError(
        'Failed to update user profile, please try again later.'
      )
    }
  }
  const updateUserPlansOrder = async (payload: { plansOrder: string[] }) => {
    try {
      const { plansOrder } = payload
      const { isAuthenticated } = userStore.getCurrentAuthInfo
      if (!cookie.value || !isAuthenticated) {
        errorStore.setError('No user authentication found, please login')
        return
      }
      const res: ProfileType = await $fetch('/api/profile/plans-order', {
        method: 'PUT',
        body: { plansOrder },
      })
      if (!res) {
        errorStore.setError(
          'Failed to get response from server, please try again'
        )
        return
      }
      await getCurrentUserProfile()
    } catch (error) {
      errorStore.setError(
        'Failed to update plans order, please try again later.'
      )
    }
  }
  const toggleUserDarkMode = async (payload: { dark: boolean }) => {
    try {
      const { dark } = payload
      const { isAuthenticated } = userStore.getCurrentAuthInfo
      if (!cookie.value || !isAuthenticated) {
        errorStore.setError('No user authentication found, please login')
        return
      }
      const res: ProfileType = await $fetch('/api/profile/dark', {
        method: 'PUT',
        body: { dark },
      })
      if (!res) {
        errorStore.setError(
          'Failed to get response from server, please try again'
        )
        return
      }
      await getCurrentUserProfile()
    } catch (error) {
      errorStore.setError(
        'Failed to toggle color mode, please try again later.'
      )
    }
  }
})
