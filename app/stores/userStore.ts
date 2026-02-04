// import { type UserModel } from '@/server/models'
import type { AuthInput } from '#shared/dto/auth'
import type {
  NewUsernameInput,
  PwUpdateInput,
  UserInput,
} from '#shared/dto/user'
import type { UserDto } from '#shared/types'
import type { H3Error } from 'h3'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useAlertStore } from './alertStore'
import { usePlanStore } from './planStore'
import { useProfileStore } from './profileStore'

interface AuthToken {
  access_token: string
}

export const useUserStore = defineStore('user', () => {
  const alertStore = useAlertStore()
  const planStore = usePlanStore()
  const profileStore = useProfileStore()
  const cookie = useAuthToken()
  // state
  const currentUser = ref<UserDto | null>(null)
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
    try {
      if (!cookie.value)
        throw new Error('No user authentication found, please login')

      const res = await $fetch<UserDto>('/api/auth', {
        method: 'GET',
        headers: { Authorization: cookie.value },
      })
      currentUser.value = res
      isAuthenticated.value = true
    } catch (error) {
      handleAuthError(error)
    }
  }
  const getCurrentUser = async () => {
    try {
      if (!cookie.value)
        throw new Error('No user authentication found, please login')

      const res = await $fetch<UserDto>('/api/auth', {
        method: 'GET',
        headers: { Authorization: cookie.value },
      })
      currentUser.value = res
      isAuthenticated.value = true
      alertStore.setAlert('Successfully authenticated user', 'success')
    } catch (error) {
      handleAuthError(error)
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
      handleAuthError(error)
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
      handleAuthError(error)
    }
  }
  const updateUsername = async (payload: NewUsernameInput) => {
    try {
      if (!cookie.value)
        throw new Error('No user authentication found, please login')

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
    try {
      if (!cookie.value)
        throw new Error('No user authentication found, please login')

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
  const clearUserStore = () => {
    cookie.value = null
    currentUser.value = null
    isAuthenticated.value = false
  }
  const logoutUser = () => {
    clearUserStore()
    planStore.clearPlanData()
    profileStore.clearProfileData()
    alertStore.setAlert('Logout Successful!', 'success')
  }
  const handleAuthError = (err: unknown) => {
    const errorMessage: string = extractErrorMessage(err)
    const checkAuthError: boolean = isAuthError(err)

    if (checkAuthError) {
      currentUser.value = null
      isAuthenticated.value = false
    }

    console.error(errorMessage)
    alertStore.setAlert(errorMessage)
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
    clearUserStore,
  }
})
