import localforage from 'localforage'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDrafts } from '@/composables/useDrafts'

vi.mock('localforage', async () => {
  const { memoryLocalforage } = await import('./helpers')
  return { default: memoryLocalforage() }
})

type MemoryForage = {
  stores: Map<string, Map<string, unknown>>
  control: { failWrites: boolean }
}
const forage = localforage as unknown as MemoryForage
const draftStore = () => {
  if (!forage.stores.has('drafts')) forage.stores.set('drafts', new Map())
  return forage.stores.get('drafts')!
}
const data = { title: 't', content: '', type: 'personal' }

describe('useDrafts', () => {
  beforeEach(() => {
    draftStore().clear()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    forage.control.failWrites = false
    vi.restoreAllMocks()
  })

  it("lists only the given user's drafts", async () => {
    const drafts = useDrafts()
    await drafts.save('userA', 'new-1', data)
    await drafts.save('userB', 'p1', { ...data, title: 'b' })
    expect(await drafts.list('userA')).toEqual([{ id: 'new-1', data }])
    expect(await drafts.list('userB')).toEqual([
      { id: 'p1', data: { ...data, title: 'b' } },
    ])
    await drafts.remove('userA', 'new-1')
    expect(await drafts.list('userA')).toEqual([])
    expect(await drafts.list('userB')).toHaveLength(1)
  })

  it('save reports whether the browser stored the draft', async () => {
    const drafts = useDrafts()
    expect(await drafts.save('userA', 'p1', data)).toBe(true)
    forage.control.failWrites = true
    expect(await drafts.save('userA', 'p2', data)).toBe(false)
    expect(await drafts.list('userA')).toEqual([{ id: 'p1', data }])
  })

  it('claimLegacy keeps old drafts of your own plans and drops drafts nobody can be sure of', async () => {
    // drafts written before they were stored per user: keyed 'new' or a plan id
    draftStore().set('new', { data, timestamp: 1 })
    draftStore().set('mine', { data, timestamp: 2 })
    draftStore().set('notmine', { data, timestamp: 3 })
    draftStore().set('userB:p2', { data, timestamp: 4 })
    const drafts = useDrafts()
    await drafts.claimLegacy('userA', ['mine'])
    expect([...draftStore().keys()].sort()).toEqual(['userA:mine', 'userB:p2'])
    expect(await drafts.list('userA')).toEqual([{ id: 'mine', data }])
  })

  it('claimLegacy does not overwrite a newer draft of the same plan', async () => {
    draftStore().set('mine', { data: { ...data, title: 'old' }, timestamp: 1 })
    draftStore().set('userA:mine', { data: { ...data, title: 'new' }, timestamp: 2 })
    await useDrafts().claimLegacy('userA', ['mine'])
    expect([...draftStore().keys()]).toEqual(['userA:mine'])
    expect(await useDrafts().list('userA')).toEqual([
      { id: 'mine', data: { ...data, title: 'new' } },
    ])
  })
})
