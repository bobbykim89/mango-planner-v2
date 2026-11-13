import { usePlanStore, useSessionStore, useUserStore } from '@/stores'

export default defineNuxtPlugin({
  name: 'stores-init',
  dependsOn: ['pinia'],
  async setup(nuxtApp) {
    const session = useSessionStore()
    // The server already initialised the stores and Pinia hydrated that state, so
    // don't fetch it all again; only load what lives in the browser (IndexedDB drafts).
    if (import.meta.client && nuxtApp.isHydrating && session.mounted) {
      const { isAuthenticated, currentUser } = useUserStore()
      if (isAuthenticated && currentUser) await usePlanStore().loadDrafts(currentUser._id)
      return
    }
    await session.init()
  },
})
