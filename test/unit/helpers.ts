import { registerEndpoint } from '@nuxt/test-utils/runtime'
import { setResponseStatus, type EventHandler, type H3Event } from 'h3'
import { createPinia, setActivePinia } from 'pinia'

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

/** Fresh Pinia state and no session cookie. Call in beforeEach. */
export const resetState = () => {
  setActivePinia(createPinia())
  useAuthToken().value = null
}

/** Sets the session cookie the stores send as the Authorization header. */
export const signIn = (token = 'Bearer test') => {
  useAuthToken().value = token
}

/** A success envelope. */
export const ok = <T>(data: T) => ({ ok: true as const, data })

/** Sets the status and returns a failure envelope. */
export const fail = (
  event: H3Event,
  status: number,
  code: string,
  message: string,
) => {
  setResponseStatus(event, status)
  return { ok: false as const, error: { code, message } }
}

const cleanups: Array<() => void> = []

/** Mocks one API route for the current test; undo with clearApiMocks(). */
export const mockApi = (method: Method, url: string, handler: EventHandler) => {
  cleanups.push(registerEndpoint(url, { method, handler }))
}

/** Removes every route mocked with mockApi. Call in afterEach. */
export const clearApiMocks = () => {
  while (cleanups.length) cleanups.pop()!()
}

/**
 * In-memory stand-in for localforage (happy-dom has no IndexedDB). Use as
 * `vi.mock('localforage', () => ({ default: memoryLocalforage() }))`; the
 * returned `stores` map exposes the data by store name for assertions; set
 * `control.failWrites` to make setItem reject (a full quota, private mode).
 */
export const memoryLocalforage = () => {
  const stores = new Map<string, Map<string, unknown>>()
  const control = { failWrites: false }
  const createInstance = ({ storeName = 'default' }: { storeName?: string }) => {
    if (!stores.has(storeName)) stores.set(storeName, new Map())
    const data = stores.get(storeName)!
    return {
      getItem: async <T>(key: string) => (data.get(key) as T) ?? null,
      setItem: async <T>(key: string, value: T) => {
        if (control.failWrites) throw new DOMException('Quota exceeded', 'QuotaExceededError')
        data.set(key, value)
        return value
      },
      removeItem: async (key: string) => {
        data.delete(key)
      },
      keys: async () => [...data.keys()],
    }
  }
  return { INDEXEDDB: 'asyncStorage', createInstance, stores, control }
}
