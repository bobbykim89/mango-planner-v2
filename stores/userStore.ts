import { type UserModel } from '@/server/models'
import type { H3Error } from 'h3'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useAlertStore, usePlanStore, useProfileStore } from './'
import type {
  UserInput,
  NewUsernameInput,
  PwUpdateInput,
} from '@/server/controller/user/dto'
import type { AuthInput } from '@/server/controller/auth/dto'

interface AuthToken {
  access_token: string
}

export const useUserStore = defineStore('user', () => {
  const alertStore = useAlertStore()
  const planStore = usePlanStore()
  const profileStore = useProfileStore()
  const cookie = useAuthToken()
  // state
  const currentUser = ref<UserModel | null>(null)
  const isAuthenticated = ref<boolean>(false)
  // getters
  const getCurrentAuthInfo = computed(() => {
    return {
      currentUser: currentUser.value,
      isAuthenticated: isAuthenticated.value,
    }
  })
  // actions
  const authUser = async () => {
    if (!cookie.value) return
    try {
      const res = await $fetch<UserModel>('/api/auth', {
        method: 'GET',
        headers: { Authorization: cookie.value },
      })
      currentUser.value = res
      isAuthenticated.value = true
    } catch (error) {
      alertStore.setAlert((error as H3Error).statusMessage!)
      currentUser.value = null
      isAuthenticated.value = false
    }
  }
  const getCurrentUser = async () => {
    if (!cookie.value) return
    try {
      const res = await $fetch<UserModel>('/api/auth', {
        method: 'GET',
        headers: { Authorization: cookie.value },
      })
      currentUser.value = res
      isAuthenticated.value = true
      alertStore.setAlert('Successfully authenticated user', 'success')
    } catch (error) {
      alertStore.setAlert((error as H3Error).statusMessage!)
      currentUser.value = null
      isAuthenticated.value = false
      cookie.value = null
    }
  }
  const loginWithCredential = async (payload: AuthInput) => {
    try {
      const res = await $fetch<AuthToken>('/api/auth', {
        method: 'POST',
        body: payload,
      })
      cookie.value = res.access_token
      await authUser()
      alertStore.setAlert('Login Successful!', 'success')
    } catch (error) {
      alertStore.setAlert((error as H3Error).statusMessage!)
      currentUser.value = null
      isAuthenticated.value = false
    }
  }
  const signupNewUser = async (payload: UserInput) => {
    try {
      const res = await $fetch<AuthToken>('/api/user', {
        method: 'POST',
        body: payload,
      })
      cookie.value = res.access_token
      await authUser()
      alertStore.setAlert('Signup Successful!', 'success')
    } catch (error) {
      alertStore.setAlert((error as H3Error).statusMessage!)
      currentUser.value = null
      isAuthenticated.value = false
    }
  }
  const updateUsername = async (payload: NewUsernameInput) => {
    if (!cookie.value) return
    try {
      await $fetch('/api/user/username', {
        method: 'PUT',
        headers: { Authorization: cookie.value },
        body: payload,
      })
      await authUser()
      alertStore.setAlert('Successfully updated username!', 'success')
    } catch (error) {
      alertStore.setAlert((error as H3Error).statusMessage!)
    }
  }
  const updatePassword = async (payload: PwUpdateInput) => {
    if (!cookie.value) return
    try {
      await $fetch('/api/user/password', {
        method: 'PUT',
        headers: { Authorization: cookie.value },
        body: payload,
      })
      await authUser()
      alertStore.setAlert('Successfully updated user password!', 'success')
    } catch (error) {
      alertStore.setAlert((error as H3Error).statusMessage!)
    }
  }
  const logoutUser = () => {
    cookie.value = null
    currentUser.value = null
    isAuthenticated.value = false
    planStore.clearPlanData()
    profileStore.clearProfileData()
    alertStore.setAlert('Logout Successful!', 'success')
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
