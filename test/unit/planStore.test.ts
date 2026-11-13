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

type MemoryForage = { stores: Map<string, Map<string, unknown>> }
const draftStore = () => {
  const { stores } = localforage as unknown as MemoryForage
  if (!stores.has('drafts')) stores.set('drafts', new Map())
  return stores.get('drafts')!
}

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
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    clearApiMocks()
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

  it('a failed create saves the draft and lists it at once', async () => {
    mockApi('POST', '/api/plan', (e) =>
      fail(e, 500, 'INTERNAL_ERROR', 'Something went wrong on our side. Please try again.'),
    )
    const input = { title: 'unsaved', content: 'x', type: 'work' }
    const store = usePlanStore()
    expect(await store.createPlan(input)).toBeNull()
    expect(store.drafts).toEqual([{ id: 'new', data: input }])
    const record = draftStore().get('new') as { data: unknown; timestamp: unknown }
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
    const store = usePlanStore()
    const pending = store.createPlan(input)
    // PlanInputForm resets the object it emitted right after emitting, before the request fails
    input.title = ''
    input.content = ''
    await pending
    const saved = { title: 'unsaved', content: 'x', type: 'work' }
    expect(store.drafts[0]?.data).toEqual(saved)
    expect((draftStore().get('new') as { data: unknown }).data).toEqual(saved)
  })

  it('a failed update keeps the draft values after the form clears its input', async () => {
    mockApi('PUT', '/api/plan/p1', (e) =>
      fail(e, 500, 'INTERNAL_ERROR', 'Something went wrong on our side. Please try again.'),
    )
    const body = { title: 'edited', content: 'y', type: 'chore' }
    const store = usePlanStore()
    store.plans = [plan('p1')]
    const pending = store.updatePlan({ id: 'p1', body })
    body.title = ''
    await pending
    expect(store.drafts[0]?.data).toEqual({ title: 'edited', content: 'y', type: 'chore' })
  })

  it('deletePlan also removes a draft saved for that plan', async () => {
    const store = usePlanStore()
    store.plans = [plan('p1')]
    const data = { title: 'stale', content: '', type: 'personal' }
    draftStore().set('p1', { data, timestamp: 1 })
    store.drafts = [{ id: 'p1', data }]
    mockApi('DELETE', '/api/plan/p1', () => ok({ id: 'p1' }))
    expect(await store.deletePlan('p1')).toBe(true)
    expect(store.drafts).toEqual([])
    expect(draftStore().has('p1')).toBe(false)
  })

  it.each([
    [404, 'PLAN_NOT_FOUND', "That plan doesn't exist."],
    [403, 'FORBIDDEN', "You don't have access to that."],
  ])(
    'saving a draft for a plan that can never be updated (%s %s) drops the draft',
    async (status, code, message) => {
      const store = usePlanStore()
      const data = { title: 'stale', content: '', type: 'personal' }
      draftStore().set('gone', { data, timestamp: 1 })
      store.drafts = [{ id: 'gone', data }]
      mockApi('PUT', '/api/plan/gone', (e) => fail(e, status, code, message))
      expect(await store.updatePlan({ id: 'gone', body: data })).toBe(false)
      expect(store.drafts).toEqual([])
      expect(draftStore().has('gone')).toBe(false)
      expect(useAlertStore().alert).toBe(message)
    },
  )

  it('a failed update keeps the draft under the plan id', async () => {
    mockApi('PUT', '/api/plan/p1', (e) =>
      fail(e, 500, 'INTERNAL_ERROR', 'Something went wrong on our side. Please try again.'),
    )
    const store = usePlanStore()
    store.plans = [plan('p1')]
    expect(
      await store.updatePlan({ id: 'p1', body: { title: 'edited' } }),
    ).toBe(false)
    expect(store.drafts.map((d) => d.id)).toEqual(['p1'])
  })
})
