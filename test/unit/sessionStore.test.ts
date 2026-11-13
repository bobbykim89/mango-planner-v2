import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useAlertStore,
  usePlanStore,
  useProfileStore,
  useSessionStore,
  useUserStore,
} from '@/stores'
import type { PlanDto, ProfileDto, UserDto } from '#shared/types'
import { clearApiMocks, resetState, signIn } from './helpers'

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)

const seedEverything = () => {
  signIn()
  const user = useUserStore()
  user.currentUser = { _id: 'u1', name: 'A', email: 'a@b.c' } as UserDto
  user.isAuthenticated = true
  user.fieldErrors = { email: 'taken' }
  const profile = useProfileStore()
  profile.userProfile = { _id: 'pr1', plansOrder: ['p1'], dark: true } as unknown as ProfileDto
  profile.darkMode = true
  const plan = usePlanStore()
  plan.plans = [{ _id: 'p1', title: 't' } as unknown as PlanDto]
  plan.drafts = [{ id: 'new', data: { title: 'd', content: '', type: 'personal' } }]
}

const expectAllCleared = () => {
  const user = useUserStore()
  expect(user.currentUser).toBeNull()
  expect(user.isAuthenticated).toBe(false)
  expect(user.fieldErrors).toEqual({})
  const profile = useProfileStore()
  expect(profile.userProfile).toBeNull()
  expect(profile.darkMode).toBe(false)
  const plan = usePlanStore()
  expect(plan.plans).toEqual([])
  expect(plan.drafts).toEqual([])
}

describe('sessionStore', () => {
  beforeEach(() => {
    resetState()
    navigateToMock.mockReset()
  })
  afterEach(() => {
    clearApiMocks()
  })

  it('expire clears every store but keeps the alert, then redirects once', async () => {
    seedEverything()
    const session = useSessionStore()
    await Promise.all([session.expire('A'), session.expire('B')])
    expectAllCleared()
    expect(useAuthToken().value).toBeNull()
    expect(navigateToMock).toHaveBeenCalledTimes(1)
    expect(navigateToMock).toHaveBeenCalledWith('/auth/login')
    expect(useAlertStore().alert).toBe('A')
  })

  it('logout clears everything and confirms', () => {
    seedEverything()
    useSessionStore().logout()
    expectAllCleared()
    expect(useAuthToken().value).toBeNull()
    expect(useAlertStore().alert).toBe('Logout Successful!')
    expect(useAlertStore().alertColor).toBe('success')
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('clearAll leaves nothing behind for the next user', () => {
    seedEverything()
    useSessionStore().clearAll()
    expectAllCleared()
  })
})
