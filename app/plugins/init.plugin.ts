import { useInitPiniaStore } from '@/stores'

export default defineNuxtPlugin({
  name: 'stores-init',
  async setup(nuxtApp) {
    const initStore = useInitPiniaStore()
    nuxtApp.hook('app:created', async () => {
      await initStore.initStores()
    })
  },
})
