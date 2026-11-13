import type { AuthInput } from '#shared/dto/auth'
import type {
  NewUsernameInput,
  PwUpdateInput,
  UserInput,
} from '#shared/dto/user'
import type { UserDto } from '#shared/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'

interface AuthToken {
  accessToken: string
}

export const useUserStore = defineStore('user', () => {
  const run = useStoreAction()
  const api = useApi()
  const cookie = useAuthToken()
  const errorCheck = useErrorCheck()
  // state
  const currentUser = ref<UserDto | null>(null)
  const isAuthenticated = ref<boolean>(false)
  // per-field messages from the last VALIDATION_FAILED response, keyed by field name
  const fieldErrors = ref<Record<string, string>>({})
  const setFieldErrors = (err: unknown) => {
    fieldErrors.value = fieldMap(err)
  }
  // actions
  /** Loads the signed-in user. A rejected cookie is dropped here, without a redirect. */
  const fetchCurrentUser = () =>
    run(
      async () => {
        currentUser.value = await api<UserDto>('/api/auth')
        isAuthenticated.value = true
      },
      {
        expireOnAuthError: false,
        onError: (err) => {
          if (!errorCheck.isAuthError(err)) return
          cookie.value = null
          clear()
        },
      },
    )
  /** Stores the session token; sessionStore.init() then loads the user's data. */
  const login = (payload: AuthInput) => {
    fieldErrors.value = {}
    return run(
      async () => {
        const res = await api<AuthToken>('/api/auth', {
          method: 'POST',
          body: payload,
        })
        cookie.value = res.accessToken
      },
      {
        requireAuth: false,
        success: 'Login Successful!',
        onError: setFieldErrors,
      },
    )
  }
  const signup = (payload: UserInput) => {
    fieldErrors.value = {}
    return run(
      async () => {
        const res = await api<AuthToken>('/api/user', {
          method: 'POST',
          body: payload,
        })
        cookie.value = res.accessToken
      },
      {
        requireAuth: false,
        success: 'Signup Successful!',
        onError: setFieldErrors,
      },
    )
  }
  const updateUsername = (payload: NewUsernameInput) => {
    fieldErrors.value = {}
    return run(
      async () => {
        currentUser.value = await api<UserDto>('/api/user/username', {
          method: 'PUT',
          body: payload,
        })
      },
      { success: 'Successfully updated username!', onError: setFieldErrors },
    )
  }
  const updatePassword = (payload: PwUpdateInput) => {
    fieldErrors.value = {}
    return run(
      () => api('/api/user/password', { method: 'PUT', body: payload }),
      {
        success: 'Successfully updated user password!',
        onError: setFieldErrors,
      },
    )
  }
  const clear = () => {
    currentUser.value = null
    isAuthenticated.value = false
    fieldErrors.value = {}
  }
  return {
    currentUser,
    isAuthenticated,
    fieldErrors,
    fetchCurrentUser,
    login,
    signup,
    updateUsername,
    updatePassword,
    clear,
  }
})
