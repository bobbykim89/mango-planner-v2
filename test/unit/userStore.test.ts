import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { setResponseStatus } from 'h3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAlertStore, useUserStore } from '@/stores'
import { clearApiMocks, fail, mockApi, ok, resetState, signIn } from './helpers'

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)

/** Counts GET /api/auth calls (a refetch the store should no longer make). */
const countAuthFetches = () => {
  const counter = { calls: 0 }
  mockApi('GET', '/api/auth', () => {
    counter.calls++
    return ok({ _id: 'u1', name: 'A', email: 'a@b.c' })
  })
  return counter
}

describe('userStore', () => {
  beforeEach(() => {
    resetState()
    navigateToMock.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    clearApiMocks()
    vi.restoreAllMocks()
  })

  it('login stores the token and shows one success alert', async () => {
    const auth = countAuthFetches()
    mockApi('POST', '/api/auth', () => ok({ accessToken: 'Bearer abc' }))
    const user = useUserStore()
    expect(await user.login({ email: 'a@b.c', password: 'x' })).toBe(true)
    expect(useAuthToken().value).toBe('Bearer abc')
    expect(useAlertStore().alert).toBe('Login Successful!')
    expect(auth.calls).toBe(0)
  })

  it('login with a wrong password keeps the user on the page', async () => {
    mockApi('POST', '/api/auth', (e) =>
      fail(e, 401, 'AUTH_INVALID_CREDENTIALS', 'Email or password is incorrect.'),
    )
    const user = useUserStore()
    expect(await user.login({ email: 'a@b.c', password: 'bad' })).toBe(false)
    expect(useAlertStore().alert).toBe('Email or password is incorrect.')
    expect(navigateToMock).not.toHaveBeenCalled()
    expect(useAuthToken().value).toBeNull()
  })

  it('signup maps validation errors to fieldErrors', async () => {
    let fieldsSeenAtRequest: Record<string, string> | undefined
    const user = useUserStore()
    mockApi('POST', '/api/user', (e) => {
      fieldsSeenAtRequest = { ...user.fieldErrors }
      setResponseStatus(e, 400)
      return {
        ok: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'x',
          fields: [{ field: 'email', message: 'Enter a valid email address.' }],
        },
      }
    })
    const input = { name: 'A', email: 'bad', password: 'Testing1!' }
    expect(await user.signup(input)).toBe(false)
    expect(user.fieldErrors).toEqual({ email: 'Enter a valid email address.' })
    await user.signup(input)
    expect(fieldsSeenAtRequest).toEqual({})
  })

  it('updateUsername uses the response instead of refetching', async () => {
    signIn()
    const auth = countAuthFetches()
    mockApi('PUT', '/api/user/username', () =>
      ok({ _id: 'u1', name: 'New', email: 'a@b.c' }),
    )
    const user = useUserStore()
    expect(await user.updateUsername({ username: 'New' })).toBe(true)
    expect(user.currentUser?.name).toBe('New')
    expect(useAlertStore().alert).toBe('Successfully updated username!')
    expect(auth.calls).toBe(0)
  })

  it('fetchCurrentUser with a stale cookie clears it without redirecting', async () => {
    signIn('Bearer stale')
    mockApi('GET', '/api/auth', (e) =>
      fail(e, 401, 'AUTH_TOKEN_INVALID', 'Please sign in to continue.'),
    )
    const user = useUserStore()
    expect(await user.fetchCurrentUser()).toBe(false)
    expect(useAuthToken().value).toBeNull()
    expect(user.isAuthenticated).toBe(false)
    expect(navigateToMock).not.toHaveBeenCalled()
  })
})
