import { useInitPiniaStore } from '@/stores'

export default defineNuxtRouteMiddleware(async () => {
  const initPiniaStore = useInitPiniaStore()
  await initPiniaStore.initStores()
})
