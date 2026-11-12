import type { AuthInput } from '#shared/dto/auth'
import type {
  NewUsernameInput,
  PwUpdateInput,
  UserInput,
} from '#shared/dto/user'
import type { UserDto } from '#shared/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useAlertStore } from './alertStore'
import { usePlanStore } from './planStore'
import { useProfileStore } from './profileStore'

interface AuthToken {
  accessToken: string
}

export const useUserStore = defineStore('user', () => {
  const errorCheck = useErrorCheck()
  const alertStore = useAlertStore()
  const planStore = usePlanStore()
  const profileStore = useProfileStore()
  const cookie = useAuthToken()
  const api = useApi()
  // state
  const currentUser = ref<UserDto | null>(null)
  const isAuthenticated = ref<boolean>(false)
  // per-field messages from the last VALIDATION_FAILED response, keyed by field name
  const fieldErrors = ref<Record<string, string>>({})
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
      if (!cookie.value) return

      const res = await api<UserDto>('/api/auth', {
        method: 'GET',
      })
      currentUser.value = res
      isAuthenticated.value = true
    } catch (error) {
      handleAuthError(error)
    }
  }
  const getCurrentUser = async () => {
    try {
      if (!cookie.value) return

      const res = await api<UserDto>('/api/auth', {
        method: 'GET',
      })
      currentUser.value = res
      isAuthenticated.value = true
      alertStore.setAlert('Successfully authenticated user', 'success')
    } catch (error) {
      handleAuthError(error)
      // only drop the stored token when the server rejected it
      if (errorCheck.isAuthError(error)) cookie.value = null
    }
  }
  const loginWithCredential = async (payload: AuthInput) => {
    fieldErrors.value = {}
    try {
      const res = await api<AuthToken>('/api/auth', {
        method: 'POST',
        body: payload,
      })
      cookie.value = res.accessToken
      await authUser()
      alertStore.setAlert('Login Successful!', 'success')
    } catch (error) {
      handleAuthError(error)
    }
  }
  const signupNewUser = async (payload: UserInput) => {
    fieldErrors.value = {}
    try {
      const res = await api<AuthToken>('/api/user', {
        method: 'POST',
        body: payload,
      })
      cookie.value = res.accessToken
      await authUser()
      alertStore.setAlert('Signup Successful!', 'success')
    } catch (error) {
      handleAuthError(error)
    }
  }
  const updateUsername = async (payload: NewUsernameInput) => {
    fieldErrors.value = {}
    try {
      if (!cookie.value) return

      await api('/api/user/username', {
        method: 'PUT',
        body: payload,
      })
      await authUser()
      alertStore.setAlert('Successfully updated username!', 'success')
    } catch (error) {
      handleAuthError(error)
    }
  }
  const updatePassword = async (payload: PwUpdateInput) => {
    fieldErrors.value = {}
    try {
      if (!cookie.value) return

      await api('/api/user/password', {
        method: 'PUT',
        body: payload,
      })
      await authUser()
      alertStore.setAlert('Successfully updated user password!', 'success')
    } catch (error) {
      handleAuthError(error)
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
    const errorMessage: string = errorCheck.extractErrorMessage(err)
    const checkAuthError: boolean = errorCheck.isAuthError(err)

    if (checkAuthError) {
      currentUser.value = null
      isAuthenticated.value = false
    }
    fieldErrors.value = fieldMap(err)

    console.error(errorMessage)
    alertStore.setAlert(errorMessage)
  }
  return {
    currentUser,
    isAuthenticated,
    fieldErrors,
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
