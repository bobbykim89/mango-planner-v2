import { useInitPiniaStore } from '@/stores'

export default defineNuxtPlugin({
  name: 'stores-init',
  // enforce: 'pre', // runs before other plugins and middleware
  dependsOn: ['pinia'],
  async setup() {
    const initStore = useInitPiniaStore()
    await initStore.initStores()
    // nuxtApp.hook('app:created', async () => {
    // })
  },
})
