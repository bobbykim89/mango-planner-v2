import { defineStore } from 'pinia'
import { useCookie, useFetch } from '#imports'
import { useAlertStore, useInitPiniaStore } from './'
import { User } from '@/server/models'
import { ref, computed } from 'vue'

type UserType = InstanceType<typeof User>

interface AuthToken {
  access_token: string
}

export const useUserStore = defineStore('user', () => {
  const alertStore = useAlertStore()
  const initPiniaStore = useInitPiniaStore()
  const cookie = useAuthToken()
  // state
  const currentUser = ref<UserType | null>(null)
  const isAuthenticated = ref<boolean>(false)
  // getters
  const getCurrentAuthInfo = computed(() => {
    return {
      currentUser: currentUser.value,
      isAuthenticated: isAuthenticated.value,
    }
  })
  // actions
  const getCurrentUser = async () => {
    if (!cookie.value) {
      return
    }
    const res = await $fetch<UserType>('/api/auth', {
      method: 'GET',
      headers: { Authorization: cookie.value },
    })
    initPiniaStore.setLoading(true)
    if (!res) {
      currentUser.value = null
      isAuthenticated.value = false
      return
    }
    currentUser.value = res
    isAuthenticated.value = true
    initPiniaStore.setLoading(false)
    alertStore.setAlert('Auccessfully authenticated user')
  }
  const loginWithCredential = async (payload: {
    email: string
    password: string
  }) => {
    const res = await $fetch<AuthToken>('/api/auth', {
      method: 'POST',
      body: payload,
    })
    initPiniaStore.setLoading(true)
    if (!res) {
      alertStore.setAlert("Couldn't fetch user data from server.")
      currentUser.value = null
      isAuthenticated.value = false
      return
    }
    cookie.value = res.access_token
    await getCurrentUser()
    initPiniaStore.setLoading(false)
    alertStore.setAlert('Login Successful!')
  }
  const signupNewUser = async (payload: {
    email: string
    password: string
    name: string
  }) => {
    const res = await $fetch<AuthToken>('/api/user', {
      method: 'POST',
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
    cookie.value = res.access_token
    await getCurrentUser()
    initPiniaStore.setLoading(false)
    alertStore.setAlert('Signup Successful!')
  }
  const updateUsername = async (payload: { username: string }) => {
    if (!cookie.value) {
      return
    }
    const res = await $fetch('/api/user/username', {
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
    await getCurrentUser()
    initPiniaStore.setLoading(false)
    alertStore.setAlert('Successfully updated username!')
  }
  const updatePassword = async (payload: {
    currentPassword: string
    newPassword: string
  }) => {
    if (!cookie.value) {
      return
    }
    const res = await $fetch('/api/user/password', {
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
    await getCurrentUser()
    initPiniaStore.setLoading(false)
    alertStore.setAlert('Successfully updated user password!')
  }
  const logoutUser = () => {
    initPiniaStore.setLoading(true)
    cookie.value = null
    currentUser.value = null
    isAuthenticated.value = false
    initPiniaStore.setLoading(false)
    alertStore.setAlert('Logout Successful!')
  }
  return {
    currentUser,
    isAuthenticated,
    // accessToken,
    getCurrentAuthInfo,
    getCurrentUser,
    loginWithCredential,
    signupNewUser,
    updateUsername,
    updatePassword,
    logoutUser,
  }
})
