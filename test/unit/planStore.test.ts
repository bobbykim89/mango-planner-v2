import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import localforage from 'localforage'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAlertStore, usePlanStore } from '@/stores'
import type { PlanDto } from '#shared/types'
import { clearApiMocks, fail, mockApi, ok, resetState, signIn } from './helpers'

vi.mock('localforage', async () => {
  const { memoryLocalforage } = await import('./helpers')
  return { default: memoryLocalforage() }
})
const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)

type MemoryForage = {
  stores: Map<string, Map<string, unknown>>
  control: { failWrites: boolean }
}
const forage = localforage as unknown as MemoryForage
const draftStore = () => {
  if (!forage.stores.has('drafts')) forage.stores.set('drafts', new Map())
  return forage.stores.get('drafts')!
}
/** The plan store with drafts loaded for a signed-in user (keys in storage are '<user>:<draft id>'). */
const storeFor = async (user = 'u1') => {
  const store = usePlanStore()
  await store.loadDrafts(user)
  return store
}
const serverError = (e: Parameters<typeof fail>[0]) =>
  fail(e, 500, 'INTERNAL_ERROR', 'Something went wrong on our side. Please try again.')

const plan = (id: string, over: Partial<PlanDto> = {}) =>
  ({ _id: id, title: id, content: '', type: 'personal', complete: false, ...over }) as unknown as PlanDto

/** Counts GET /api/plan calls (a refetch the store should no longer make). */
const countPlanFetches = () => {
  const counter = { calls: 0 }
  mockApi('GET', '/api/plan', () => {
    counter.calls++
    return ok([])
  })
  return counter
}

describe('planStore', () => {
  beforeEach(() => {
    resetState()
    signIn()
    draftStore().clear()
    navigateToMock.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    clearApiMocks()
    forage.control.failWrites = false
    vi.restoreAllMocks()
  })

  it('updatePlan moves the returned plan to the front without refetching', async () => {
    const fetches = countPlanFetches()
    const store = usePlanStore()
    store.plans = [plan('A'), plan('B'), plan('C')]
    mockApi('PUT', '/api/plan/C', () => ok(plan('C', { title: 'C2' })))
    expect(
      await store.updatePlan({ id: 'C', body: { title: 'C2' } }),
    ).toBe(true)
    expect(store.plans.map((p) => p.title)).toEqual(['C2', 'A', 'B'])
    expect(useAlertStore().alert).toBe('Successfully updated plan!')
    expect(fetches.calls).toBe(0)
  })

  it('togglePlanComplete applies the response and names the state', async () => {
    const store = usePlanStore()
    store.plans = [plan('A'), plan('B')]
    mockApi('PUT', '/api/plan/A/toggle', () => ok(plan('A', { complete: true })))
    expect(
      await store.togglePlanComplete({ id: 'A', body: { complete: true } }),
    ).toBe(true)
    expect(store.getAllPlans.map((p) => p._id)).toEqual(['B', 'A'])
    expect(useAlertStore().alert).toBe('Successfully marked the plan completed')
  })

  it('deletePlan removes by the returned id', async () => {
    const fetches = countPlanFetches()
    const store = usePlanStore()
    store.plans = [plan('a'), plan('b'), plan('c')]
    mockApi('DELETE', '/api/plan/b', () => ok({ id: 'b' }))
    expect(await store.deletePlan('b')).toBe(true)
    expect(store.plans.map((p) => p._id)).toEqual(['a', 'c'])
    expect(useAlertStore().alert).toBe('Successfully deleted plan!')
    expect(fetches.calls).toBe(0)
  })

  it('a successful create returns the plan, puts it first and confirms (#32)', async () => {
    const fetches = countPlanFetches()
    mockApi('POST', '/api/plan', () => ok(plan('new')))
    const store = await storeFor()
    store.plans = [plan('old')]
    const created = await store.createPlan({ title: 'new', content: '', type: 'personal' })
    expect(created).toEqual(plan('new'))
    expect(store.plans.map((p) => p._id)).toEqual(['new', 'old'])
    expect(store.drafts).toEqual([])
    expect(useAlertStore().alert).toBe('Successfully created new plan!')
    expect(fetches.calls).toBe(0)
  })

  it.each([
    ['create', (store: ReturnType<typeof usePlanStore>) => store.createPlan({ title: 'mine', content: '', type: 'personal' }), /^u1:new-/],
    ['update', (store: ReturnType<typeof usePlanStore>) => store.updatePlan({ id: 'p1', body: { title: 'mine' } }), /^u1:p1$/],
  ] as const)('a %s rejected because the session expired keeps the draft before signing out (#32)', async (_, act, key) => {
    const expired = (e: Parameters<typeof fail>[0]) =>
      fail(e, 401, 'AUTH_TOKEN_INVALID', 'Your session has expired. Please sign in again.')
    mockApi('POST', '/api/plan', expired)
    mockApi('PUT', '/api/plan/p1', expired)
    let storedWhenRedirected: string[] = []
    navigateToMock.mockImplementation(() => {
      storedWhenRedirected = [...draftStore().keys()]
    })
    const store = await storeFor('u1')
    store.plans = [plan('p1')]
    await act(store)
    expect(navigateToMock).toHaveBeenCalledTimes(1)
    expect(storedWhenRedirected).toEqual([expect.stringMatching(key)])
    // still there for the next sign-in
    expect([...draftStore().keys()]).toEqual([expect.stringMatching(key)])
  })

  it('a failed create saves the draft and lists it at once', async () => {
    mockApi('POST', '/api/plan', (e) =>
      fail(e, 500, 'INTERNAL_ERROR', 'Something went wrong on our side. Please try again.'),
    )
    const input = { title: 'unsaved', content: 'x', type: 'work' }
    const store = await storeFor('u1')
    expect(await store.createPlan(input)).toBeNull()
    expect(store.drafts).toEqual([{ id: expect.stringMatching(/^new-/), data: input }])
    const record = draftStore().get(`u1:${store.drafts[0]!.id}`) as { data: unknown; timestamp: unknown }
    expect(record.data).toEqual(input)
    expect(typeof record.timestamp).toBe('number')
    expect(useAlertStore().alert).toBe(
      'Something went wrong on our side. Please try again.',
    )
  })

  it('a listed draft keeps its values after the form clears its input', async () => {
    mockApi('POST', '/api/plan', (e) =>
      fail(e, 500, 'INTERNAL_ERROR', 'Something went wrong on our side. Please try again.'),
    )
    const input = { title: 'unsaved', content: 'x', type: 'work' }
    const store = await storeFor('u1')
    const pending = store.createPlan(input)
    // PlanInputForm resets the object it emitted right after emitting, before the request fails
    input.title = ''
    input.content = ''
    await pending
    const saved = { title: 'unsaved', content: 'x', type: 'work' }
    expect(store.drafts[0]?.data).toEqual(saved)
    expect((draftStore().get(`u1:${store.drafts[0]!.id}`) as { data: unknown }).data).toEqual(saved)
  })

  it('a failed update keeps the draft values after the form clears its input', async () => {
    mockApi('PUT', '/api/plan/p1', (e) =>
      fail(e, 500, 'INTERNAL_ERROR', 'Something went wrong on our side. Please try again.'),
    )
    const body = { title: 'edited', content: 'y', type: 'chore' }
    const store = await storeFor()
    store.plans = [plan('p1')]
    const pending = store.updatePlan({ id: 'p1', body })
    body.title = ''
    await pending
    expect(store.drafts[0]?.data).toEqual({ title: 'edited', content: 'y', type: 'chore' })
  })

  it('deletePlan also removes a draft saved for that plan', async () => {
    const data = { title: 'stale', content: '', type: 'personal' }
    draftStore().set('u1:p1', { data, timestamp: 1 })
    const store = await storeFor('u1')
    store.plans = [plan('p1')]
    expect(store.drafts).toEqual([{ id: 'p1', data }])
    mockApi('DELETE', '/api/plan/p1', () => ok({ id: 'p1' }))
    expect(await store.deletePlan('p1')).toBe(true)
    expect(store.drafts).toEqual([])
    expect(draftStore().has('u1:p1')).toBe(false)
  })

  it.each([
    [404, 'PLAN_NOT_FOUND', "That plan doesn't exist."],
    [403, 'FORBIDDEN', "You don't have access to that."],
  ])(
    'saving a draft for a plan that can never be updated (%s %s) drops the draft',
    async (status, code, message) => {
      const data = { title: 'stale', content: '', type: 'personal' }
      draftStore().set('u1:gone', { data, timestamp: 1 })
      const store = await storeFor('u1')
      expect(store.drafts).toEqual([{ id: 'gone', data }])
      mockApi('PUT', '/api/plan/gone', (e) => fail(e, status, code, message))
      expect(await store.updatePlan({ id: 'gone', body: data })).toBe(false)
      expect(store.drafts).toEqual([])
      expect(draftStore().has('u1:gone')).toBe(false)
      expect(useAlertStore().alert).toBe(message)
    },
  )

  it('a failed update keeps the draft under the plan id', async () => {
    mockApi('PUT', '/api/plan/p1', (e) =>
      fail(e, 500, 'INTERNAL_ERROR', 'Something went wrong on our side. Please try again.'),
    )
    const store = await storeFor()
    store.plans = [plan('p1')]
    expect(
      await store.updatePlan({ id: 'p1', body: { title: 'edited' } }),
    ).toBe(false)
    expect(store.drafts.map((d) => d.id)).toEqual(['p1'])
  })

  it('two failed new plans keep two drafts (#30)', async () => {
    mockApi('POST', '/api/plan', serverError)
    const store = await storeFor()
    vi.spyOn(Date, 'now').mockReturnValueOnce(1).mockReturnValueOnce(2).mockReturnValue(3)
    await store.createPlan({ title: 'first', content: '', type: 'work' })
    await store.createPlan({ title: 'second', content: '', type: 'work' })
    expect(store.drafts.map((d) => d.data.title).sort()).toEqual(['first', 'second'])
    expect(draftStore().size).toBe(2)
  })

  it('a new-plan draft that fails again is updated, not duplicated (#30)', async () => {
    mockApi('POST', '/api/plan', serverError)
    draftStore().set('u1:new-1', { data: { title: 'v1', content: '', type: 'work' }, timestamp: 1 })
    const store = await storeFor('u1')
    // retrying a draft passes its key, so a second failure saves over the same draft
    await store.createPlan({ title: 'v2', content: '', type: 'work' }, 'new-1')
    expect(store.drafts).toEqual([{ id: 'new-1', data: { title: 'v2', content: '', type: 'work' } }])
    expect([...draftStore().keys()]).toEqual(['u1:new-1'])
  })

  it('a draft the browser could not store is not listed (#30)', async () => {
    mockApi('POST', '/api/plan', serverError)
    const store = await storeFor()
    forage.control.failWrites = true
    expect(await store.createPlan({ title: 'lost', content: '', type: 'work' })).toBeNull()
    expect(store.drafts).toEqual([])
  })

  it("loads only the signed-in user's drafts (#29)", async () => {
    const data = { title: 'theirs', content: '', type: 'personal' }
    draftStore().set('u2:new-1', { data, timestamp: 1 })
    draftStore().set('u1:p1', { data: { ...data, title: 'mine' }, timestamp: 2 })
    const store = await storeFor('u1')
    expect(store.drafts).toEqual([{ id: 'p1', data: { ...data, title: 'mine' } }])
  })

  it('clear forgets whose drafts are loaded (#29)', async () => {
    mockApi('PUT', '/api/plan/p1', serverError)
    const store = await storeFor('u1')
    store.clear()
    // a failure after sign-out has no user to keep a draft for
    await store.updatePlan({ id: 'p1', body: { title: 'x', content: '', type: 'work' } })
    expect(draftStore().size).toBe(0)
  })
})
