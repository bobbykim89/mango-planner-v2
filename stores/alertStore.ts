import type { ColorPalette } from '@bobbykim/manguito-theme'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAlertStore = defineStore('alert', () => {
  const alert = ref<string | null>(null)
  const alertColor = ref<Partial<ColorPalette>>('danger')
  const clearAlert = (timeout: number = 5000) => {
    setTimeout(() => {
      alert.value = null
      alertColor.value = 'danger'
    }, timeout)
  }
  const setAlert = (
    message: string,
    color: Partial<ColorPalette> = 'danger'
  ) => {
    alert.value = message
    alertColor.value = color
    clearAlert()
  }
  return { alert, alertColor, clearAlert, setAlert }
})
