import { defineStore } from 'pinia'
import {
  useAlertStore,
  useInitPiniaStore,
  usePlanStore,
  useProfileStore,
} from './'
import { User } from '@/server/models'
import { ref, computed } from 'vue'
import type { H3Error } from 'h3'

type UserType = InstanceType<typeof User>

interface AuthToken {
  access_token: string
}

export const useUserStore = defineStore('user', () => {
  const alertStore = useAlertStore()
  const initPiniaStore = useInitPiniaStore()
  const planStore = usePlanStore()
  const profileStore = useProfileStore()
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
    alertStore.setAlert('Successfully authenticated user')
  }
  const loginWithCredential = async (payload: {
    email: string
    password: string
  }) => {
    try {
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
    } catch (error) {
      alertStore.setAlert((error as H3Error).statusMessage!)
      currentUser.value = null
      isAuthenticated.value = false
    }
  }
  const signupNewUser = async (payload: {
    email: string
    password: string
    name: string
  }) => {
    try {
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
    } catch (error) {
      alertStore.setAlert((error as H3Error).statusMessage!)
      initPiniaStore.setLoading(false)
    }
  }
  const updateUsername = async (payload: { username: string }) => {
    try {
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
    } catch (error) {
      alertStore.setAlert((error as H3Error).statusMessage!)
      initPiniaStore.setLoading(false)
    }
  }
  const updatePassword = async (payload: {
    currentPassword: string
    newPassword: string
  }) => {
    try {
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
    } catch (error) {
      alertStore.setAlert((error as H3Error).statusMessage!)
      initPiniaStore.setLoading(false)
    }
  }
  const logoutUser = () => {
    initPiniaStore.setLoading(true)
    cookie.value = null
    currentUser.value = null
    isAuthenticated.value = false
    planStore.clearPlanData()
    profileStore.clearProfileData()
    initPiniaStore.setLoading(false)
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
