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

/**
 * Unsaved plan inputs kept in the browser (IndexedDB), keyed by 'new' or the
 * plan id. Does nothing on the server; storage failures are logged, not thrown.
 */
export const useDrafts = () => {
  const save = async (key: string, data: PlanInput) => {
    if (!import.meta.client) return
    try {
      // a plain copy: reactive proxies can't be stored
      const record = { data: JSON.parse(JSON.stringify(data)), timestamp: Date.now() }
      await getDraftDb().setItem(key, record)
    } catch (error) {
      console.error('Failed to save draft:', error)
    }
  }
  const get = async (key: string): Promise<(PlanInput & { id: string }) | null> => {
    if (!import.meta.client) return null
    try {
      const record = await getDraftDb().getItem<DraftRecord>(key)
      return record ? { id: key, ...record.data } : null
    } catch (error) {
      console.error('Failed to read draft:', error)
      return null
    }
  }
  const remove = async (key: string) => {
    if (!import.meta.client) return
    try {
      await getDraftDb().removeItem(key)
    } catch (error) {
      console.error('Failed to delete draft:', error)
    }
  }
  const list = async (): Promise<DraftFormInput[]> => {
    if (!import.meta.client) return []
    try {
      const keys = await getDraftDb().keys()
      const records = await Promise.all(
        keys.map(async (key) => {
          const record = await getDraftDb().getItem<DraftRecord>(key)
          return record ? { id: key, data: record.data } : null
        }),
      )
      return records.filter((draft) => draft !== null)
    } catch (error) {
      console.error('Failed to list drafts:', error)
      return []
    }
  }
  return { save, get, remove, list }
}
