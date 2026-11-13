import type { DraftFormInput, PlanFormInput, PlanInput } from '#shared/types'
import localforage from 'localforage'

interface DraftRecord {
  data: PlanFormInput
  timestamp: number
}

// Drafts get their own localforage instance instead of the global config set in a
// plugin: the stores can read drafts before that plugin runs, and a read before
// config() locks localforage onto its default database (#18).
type DraftDb = ReturnType<typeof localforage.createInstance>
let draftDb: DraftDb | null = null
const getDraftDb = (): DraftDb => {
  draftDb ??= localforage.createInstance({
    driver: localforage.INDEXEDDB,
    name: 'MangoPlannerV2',
    storeName: 'drafts',
  })
  return draftDb
}

// Each draft belongs to the user who wrote it: stored as '<userId>:<draft id>',
// so another account in the same browser never sees it (#29).
const storageKey = (owner: string, id: string) => `${owner}:${id}`
const isLegacyKey = (key: string) => !key.includes(':')

/**
 * Unsaved plan inputs kept in the browser (IndexedDB), per user. A draft id is
 * a plan id or a 'new-…' key (see newDraftKey). Does nothing on the server;
 * storage failures are logged, not thrown.
 */
export const useDrafts = () => {
  /** Resolves to whether the browser stored the draft. */
  const save = async (owner: string, id: string, data: PlanInput) => {
    if (!import.meta.client) return false
    try {
      // a plain copy: reactive proxies can't be stored
      const record = { data: JSON.parse(JSON.stringify(data)), timestamp: Date.now() }
      await getDraftDb().setItem(storageKey(owner, id), record)
      return true
    } catch (error) {
      console.error('Failed to save draft:', error)
      return false
    }
  }
  const remove = async (owner: string, id: string) => {
    if (!import.meta.client) return
    try {
      await getDraftDb().removeItem(storageKey(owner, id))
    } catch (error) {
      console.error('Failed to delete draft:', error)
    }
  }
  const list = async (owner: string): Promise<DraftFormInput[]> => {
    if (!import.meta.client) return []
    const prefix = storageKey(owner, '')
    try {
      const keys = (await getDraftDb().keys()).filter((key) => key.startsWith(prefix))
      const records = await Promise.all(
        keys.map(async (key) => {
          const record = await getDraftDb().getItem<DraftRecord>(key)
          return record ? { id: key.slice(prefix.length), data: record.data } : null
        }),
      )
      return records.filter((draft) => draft !== null)
    } catch (error) {
      console.error('Failed to list drafts:', error)
      return []
    }
  }
  /**
   * Drafts saved before they were stored per user have no owner. One for a plan
   * the user owns becomes theirs; any other one is dropped, because it can't be
   * told whose it is (#29).
   */
  const claimLegacy = async (owner: string, ownPlanIds: string[]) => {
    if (!import.meta.client) return
    try {
      const db = getDraftDb()
      const keys = await db.keys()
      for (const key of keys.filter(isLegacyKey)) {
        const target = storageKey(owner, key)
        if (ownPlanIds.includes(key) && !keys.includes(target)) {
          const record = await db.getItem<DraftRecord>(key)
          if (record) await db.setItem(target, record)
        }
        await db.removeItem(key)
      }
    } catch (error) {
      console.error('Failed to move old drafts:', error)
    }
  }
  return { save, remove, list, claimLegacy }
}
