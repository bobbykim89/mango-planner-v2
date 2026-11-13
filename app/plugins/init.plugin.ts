import { usePlanStore, useSessionStore, useUserStore } from '@/stores'

export default defineNuxtPlugin({
  name: 'stores-init',
  dependsOn: ['pinia'],
  async setup(nuxtApp) {
    const session = useSessionStore()
    // The server already initialised the stores and Pinia hydrated that state, so
    // don't fetch it all again; only load what lives in the browser (IndexedDB drafts).
    if (import.meta.client && nuxtApp.isHydrating && session.mounted) {
      if (useUserStore().isAuthenticated) await usePlanStore().loadAllDrafts()
      return
    }
    await session.init()
  },
})
