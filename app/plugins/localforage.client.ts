import localforage from 'localforage'

export default defineNuxtPlugin(() => {
  // config localforage
  localforage.config({
    driver: localforage.INDEXEDDB,
    name: 'MangoPlannerV2',
    storeName: 'drafts',
  })
})
