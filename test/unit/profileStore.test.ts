import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAlertStore, useProfileStore } from '@/stores'
import type { ProfileDto } from '#shared/types'
import { clearApiMocks, mockApi, ok, resetState, signIn } from './helpers'

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)

const profile = (over: Partial<ProfileDto> = {}) =>
  ({ _id: 'pr1', user: 'u1', plansOrder: ['b', 'c'], dark: false, ...over }) as unknown as ProfileDto

/** Counts GET /api/profile calls (a refetch the store should no longer make). */
const countProfileFetches = () => {
  const counter = { calls: 0 }
  mockApi('GET', '/api/profile', () => {
    counter.calls++
    return ok(profile())
  })
  return counter
}

describe('profileStore', () => {
  beforeEach(() => {
    resetState()
    signIn()
  })
  afterEach(() => {
    clearApiMocks()
  })

  it('fetchProfile with no profile leaves defaults', async () => {
    mockApi('GET', '/api/profile', () => ok(null))
    const store = useProfileStore()
    expect(await store.fetchProfile()).toBe(true)
    expect(store.userProfile).toBeNull()
    expect(store.darkMode).toBe(false)
    expect(store.getPlansOrder).toEqual([])
  })

  it("fetchProfile with no profile drops the previous user's profile and dark mode (#32)", async () => {
    const store = useProfileStore()
    store.userProfile = profile({ dark: true, plansOrder: ['x'] })
    store.darkMode = true
    mockApi('GET', '/api/profile', () => ok(null))
    expect(await store.fetchProfile()).toBe(true)
    expect(store.userProfile).toBeNull()
    expect(store.darkMode).toBe(false)
    expect(store.getPlansOrder).toEqual([])
  })

  it('toggleDarkMode uses the response and names the new state', async () => {
    const fetches = countProfileFetches()
    mockApi('PUT', '/api/profile/dark', () => ok(profile({ dark: true })))
    const store = useProfileStore()
    expect(await store.toggleDarkMode({ dark: true })).toBe(true)
    expect(store.darkMode).toBe(true)
    expect(useAlertStore().alert).toBe('Darkmode enabled')
    expect(fetches.calls).toBe(0)
  })

  it('updatePlansOrder sets the returned order without refetching', async () => {
    const fetches = countProfileFetches()
    mockApi('PUT', '/api/profile/plans-order', () =>
      ok(profile({ plansOrder: ['c', 'b'] })),
    )
    const store = useProfileStore()
    expect(await store.updatePlansOrder(['c', 'b'])).toBe(true)
    expect(store.getPlansOrder).toEqual(['c', 'b'])
    expect(fetches.calls).toBe(0)
  })

  it('addPlanToOrder and removePlanFromOrder mirror the server', () => {
    const store = useProfileStore()
    store.addPlanToOrder('a')
    store.removePlanFromOrder('a')
    expect(store.userProfile).toBeNull()

    store.userProfile = profile()
    store.addPlanToOrder('a')
    expect(store.getPlansOrder).toEqual(['a', 'b', 'c'])
    store.addPlanToOrder('a')
    expect(store.getPlansOrder).toEqual(['a', 'b', 'c'])
    store.removePlanFromOrder('b')
    expect(store.getPlansOrder).toEqual(['a', 'c'])
  })
})
