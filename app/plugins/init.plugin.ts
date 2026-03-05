import { useInitPiniaStore } from '@/stores'

export default defineNuxtPlugin({
  name: 'stores-init',
  dependsOn: ['pinia'],
  async setup() {
    const initStore = useInitPiniaStore()
    await initStore.initStores()
  },
})
