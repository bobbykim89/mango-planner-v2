import { defineStore } from 'pinia'
import { useCookie } from '#imports'
import { useErrorStore } from './'
import { User } from '@/server/models'
import { ref, computed } from 'vue'

type UserType = InstanceType<typeof User>

interface AuthToken {
  access_token: string
}

export const useUserStore = defineStore('user', () => {
  const errorStore = useErrorStore()
  const cookie = useCookie('access_token', {
    maxAge: 604800,
    sameSite: true,
  })
  // state
  const currentUser = ref<UserType | null>(null)
  const isAuthenticated = ref<boolean>()
  // getters
  const getCurrentAuthInfo = computed(() => {
    return {
      currentUser: currentUser.value,
      isAuthenticated: isAuthenticated.value,
    }
  })
  // actions
  const getCurrentUser = async () => {
    try {
      if (!cookie.value) {
        return
      }
      const data: UserType = await $fetch('/api/auth', {
        method: 'GET',
        headers: {
          Authorization: cookie.value,
        },
      })
      if (data === null) {
        currentUser.value = null
        isAuthenticated.value = false
        return
      }
      currentUser.value = data
      isAuthenticated.value = true
    } catch (error) {
      errorStore.setError('Authentication error: Cannot bring user info')
      currentUser.value = null
      isAuthenticated.value = false
      cookie.value = null
    }
  }
  const loginWithCredential = async (payload: {
    email: string
    password: string
  }) => {
    try {
      const { email, password } = payload
      const data: AuthToken = await $fetch('/api/auth', {
        method: 'POST',
        body: { email, password },
      })
      if (!data) {
        errorStore.setError("Couldn't fetch user data from server.")
        currentUser.value = null
        isAuthenticated.value = false
        return
      }
      cookie.value = data.access_token
      await getCurrentUser()
    } catch (error) {
      errorStore.setError('Invalid user credentials')
      currentUser.value = null
      isAuthenticated.value = false
      cookie.value = null
    }
  }
  const signupNewUser = async (payload: {
    email: string
    password: string
    name: string
  }) => {
    const { email, password, name } = payload
    try {
      const res: AuthToken = await $fetch('/api/user', {
        method: 'POST',
        body: { email, password, name },
      })
      if (!res) {
        errorStore.setError(
          'Failed to get response from server, please try again'
        )
        return
      }
      cookie.value = res.access_token
      await getCurrentUser()
    } catch (error) {
      errorStore.setError('Failed to create new user please try later..')
      currentUser.value = null
      isAuthenticated.value = false
      cookie.value = null
    }
  }
  const updateUsername = async (payload: { username: string }) => {
    const { username } = payload
    try {
      if (!cookie.value) {
        return
      }
      const res: AuthToken = await $fetch('/api/user/username', {
        method: 'PUT',
        headers: {
          Authorization: cookie.value,
        },
        body: { username },
      })
      if (!res) {
        errorStore.setError(
          'Failed to get response from server, please try again'
        )
        return
      }
      await getCurrentUser()
    } catch (error) {
      errorStore.setError('Failed to update username please try later..')
    }
  }
  const updatePassword = async (payload: {
    currentPassword: string
    newPassword: string
  }) => {
    const { currentPassword, newPassword } = payload
    try {
      if (!cookie.value) {
        return
      }
      const res = await $fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          Authorization: cookie.value,
        },
        body: { currentPassword, newPassword },
      })
      if (!res) {
        errorStore.setError(
          'Failed to get response from server, please try again'
        )
        return
      }
      await getCurrentUser()
    } catch (error) {
      errorStore.setError('Failed to update password please try later..')
    }
  }
  const logoutUser = async () => {
    cookie.value = null
    currentUser.value = null
    isAuthenticated.value = false
  }
  return {
    currentUser,
    isAuthenticated,
    getCurrentAuthInfo,
    getCurrentUser,
    loginWithCredential,
    signupNewUser,
    updateUsername,
    updatePassword,
    logoutUser,
  }
})
