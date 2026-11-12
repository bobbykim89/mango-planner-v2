import { useInitPiniaStore, usePlanStore, useUserStore } from '@/stores'

export default defineNuxtPlugin({
  name: 'stores-init',
  dependsOn: ['pinia'],
  async setup(nuxtApp) {
    const initStore = useInitPiniaStore()
    // The server already initialised the stores and Pinia hydrated that state, so
    // don't fetch it all again; only load what lives in the browser (IndexedDB drafts).
    if (import.meta.client && nuxtApp.isHydrating && initStore.mounted) {
      if (useUserStore().isAuthenticated) await usePlanStore().loadAllDrafts()
      return
    }
    await initStore.initStores()
  },
})
