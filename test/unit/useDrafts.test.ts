import localforage from 'localforage'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDrafts } from '@/composables/useDrafts'

vi.mock('localforage', async () => {
  const { memoryLocalforage } = await import('./helpers')
  return { default: memoryLocalforage() }
})

type MemoryForage = { stores: Map<string, Map<string, unknown>> }
const draftStore = () => {
  const { stores } = localforage as unknown as MemoryForage
  if (!stores.has('drafts')) stores.set('drafts', new Map())
  return stores.get('drafts')!
}

describe('useDrafts', () => {
  beforeEach(() => {
    draftStore().clear()
  })

  it('reads drafts written by the old code', async () => {
    const data = { title: 't', content: '', type: 'personal' }
    // the shape the pre-refactor planStore wrote
    draftStore().set('new', { data, timestamp: 1 })
    draftStore().set('p1', { data, timestamp: 2 })
    const drafts = useDrafts()
    const listed = await drafts.list()
    expect(listed).toHaveLength(2)
    expect(listed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'new', data }),
        expect.objectContaining({ id: 'p1', data }),
      ]),
    )
    expect(await drafts.get('p1')).toEqual({ id: 'p1', ...data })
    expect(await drafts.get('missing')).toBeNull()
  })
})
