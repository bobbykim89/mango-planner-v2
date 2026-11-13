import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { defineStore } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useStoreAction } from '@/composables/useStoreAction'
import { useAlertStore } from '@/stores'
import { clearApiMocks, fail, mockApi, ok, resetState, signIn } from './helpers'

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)

// a throwaway store so the runner runs inside a store setup, as in the real stores
const useTestStore = defineStore('runner-test', () => ({
  run: useStoreAction(),
  api: useApi(),
}))

describe('useStoreAction', () => {
  beforeEach(() => {
    resetState()
    navigateToMock.mockClear()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    clearApiMocks()
    vi.restoreAllMocks()
  })

  it('skips the request without a session cookie', async () => {
    let calls = 0
    mockApi('GET', '/api/x', () => {
      calls++
      return ok(1)
    })
    const { run, api } = useTestStore()
    const result = await run(() => api('/api/x'))
    expect(result).toBe(false)
    expect(calls).toBe(0)
    expect(useAlertStore().alert).toBeNull()
  })

  it('resolves true and shows the success alert', async () => {
    signIn()
    mockApi('GET', '/api/x', () => ok(7))
    const { run, api } = useTestStore()
    expect(await run(() => api<number>('/api/x'), { success: 'Done!' })).toBe(
      true,
    )
    expect(useAlertStore().alert).toBe('Done!')
    expect(useAlertStore().alertColor).toBe('success')

    await run(() => api<number>('/api/x'), { success: (r) => `got ${r}` })
    expect(useAlertStore().alert).toBe('got 7')
  })

  it('shows the error message and resolves false', async () => {
    signIn()
    mockApi('GET', '/api/x', (e) =>
      fail(e, 404, 'PLAN_NOT_FOUND', "That plan doesn't exist."),
    )
    const { run, api } = useTestStore()
    expect(await run(() => api('/api/x'))).toBe(false)
    expect(useAlertStore().alert).toBe("That plan doesn't exist.")
    expect(useAlertStore().alertColor).toBe('danger')
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('runs onError before the default handling', async () => {
    signIn()
    mockApi('GET', '/api/x', (e) =>
      fail(e, 404, 'PLAN_NOT_FOUND', "That plan doesn't exist."),
    )
    const { run, api } = useTestStore()
    let seen: unknown
    await run(() => api('/api/x'), {
      onError: (err) => {
        seen = err
        expect(useAlertStore().alert).toBeNull()
      },
    })
    expect(seen).toBeInstanceOf(ApiClientError)
    expect((seen as ApiClientError).code).toBe('PLAN_NOT_FOUND')
  })

  it('expires the session on an auth error', async () => {
    signIn()
    mockApi('GET', '/api/x', (e) =>
      fail(e, 401, 'AUTH_TOKEN_INVALID', 'Please sign in to continue.'),
    )
    const { run, api } = useTestStore()
    expect(await run(() => api('/api/x'))).toBe(false)
    expect(navigateToMock).toHaveBeenCalledWith('/auth/login')
    expect(useAuthToken().value).toBeNull()
    expect(useAlertStore().alert).toBe('Please sign in to continue.')
  })

  it('does not expire when expireOnAuthError is false', async () => {
    signIn()
    mockApi('GET', '/api/x', (e) =>
      fail(e, 401, 'AUTH_TOKEN_INVALID', 'Please sign in to continue.'),
    )
    const { run, api } = useTestStore()
    expect(await run(() => api('/api/x'), { expireOnAuthError: false })).toBe(
      false,
    )
    expect(navigateToMock).not.toHaveBeenCalled()
    expect(useAlertStore().alert).toBe('Please sign in to continue.')
  })
})
