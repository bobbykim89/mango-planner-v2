import { defineStore } from 'pinia'
import { useCookie, useFetch } from '#imports'
import { useAlertStore } from './'
import { User } from '@/server/models'
import { ref, computed } from 'vue'

type UserType = InstanceType<typeof User>

interface AuthToken {
  access_token: string
}

export const useUserStore = defineStore('user', () => {
  const alertStore = useAlertStore()
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
      // const data: UserType = await $fetch('/api/auth', {
      //   method: 'GET',
      //   headers: {
      //     Authorization: cookie.value,
      //   },
      // })
      const { data, error } = await useFetch<UserType>('/api/auth', {
        method: 'GET',
        headers: {
          Authorization: cookie.value,
        },
      })
      if (data.value === null || error.value !== null) {
        currentUser.value = null
        isAuthenticated.value = false
        return
      }
      currentUser.value = data.value
      isAuthenticated.value = true
    } catch (error) {
      alertStore.setAlert('Authentication error: Cannot bring user info')
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
      // const data: AuthToken = await $fetch('/api/auth', {
      //   method: 'POST',
      //   body: { email, password },
      // })
      const { data, error } = await useFetch<AuthToken>('/api/auth', {
        method: 'POST',
        body: { email, password },
      })

      if (!data.value || error.value !== null) {
        alertStore.setAlert("Couldn't fetch user data from server.")
        currentUser.value = null
        isAuthenticated.value = false
        return
      }
      cookie.value = data.value.access_token
      await getCurrentUser()
      alertStore.setAlert('Login Successful!')
    } catch (error) {
      alertStore.setAlert('Invalid user credentials')
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
      // const res: AuthToken = await $fetch('/api/user', {
      //   method: 'POST',
      //   body: { email, password, name },
      // })
      const { data: res, error } = await useFetch<AuthToken>('/api/user', {
        method: 'POST',
        body: { email, password, name },
      })
      if (!res.value || error.value !== null) {
        alertStore.setAlert(
          'Failed to get response from server, please try again'
        )
        return
      }
      cookie.value = res.value.access_token
      await getCurrentUser()
      alertStore.setAlert('Signup Successful!')
    } catch (error) {
      alertStore.setAlert('Failed to create new user please try later..')
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
      // const res: AuthToken = await $fetch('/api/user/username', {
      //   method: 'PUT',
      //   headers: {
      //     Authorization: cookie.value,
      //   },
      //   body: { username },
      // })
      const { data: res, error } = await useFetch('/api/user/username', {
        method: 'PUT',
        headers: { Authorization: cookie.value },
        body: { username },
      })
      if (!res.value || error.value !== null) {
        alertStore.setAlert(
          'Failed to get response from server, please try again'
        )
        return
      }
      await getCurrentUser()
      alertStore.setAlert('Successfully updated username!')
    } catch (error) {
      alertStore.setAlert('Failed to update username please try later..')
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
      // const res = await $fetch('/api/user/password', {
      //   method: 'PUT',
      //   headers: {
      //     Authorization: cookie.value,
      //   },
      //   body: { currentPassword, newPassword },
      // })
      const { data: res, error } = await useFetch('/api/user/password', {
        method: 'PUT',
        headers: { Authorization: cookie.value },
        body: { currentPassword, newPassword },
      })
      if (!res.value || error.value !== null) {
        alertStore.setAlert(
          'Failed to get response from server, please try again'
        )
        return
      }
      await getCurrentUser()
      alertStore.setAlert('Successfully updated user password!')
    } catch (error) {
      alertStore.setAlert('Failed to update password please try later..')
    }
  }
  const logoutUser = async () => {
    cookie.value = null
    currentUser.value = null
    isAuthenticated.value = false
    alertStore.setAlert('Logout Successful!')
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
