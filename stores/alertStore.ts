import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAlertStore = defineStore('alert', () => {
  const alert = ref<string | null>(null)
  const clearAlert = (timeout: number = 5000) => {
    setTimeout(() => {
      alert.value = null
    }, timeout)
  }
  const setAlert = (message: string) => {
    alert.value = message
    clearAlert()
  }
  return { alert, clearAlert, setAlert }
})
