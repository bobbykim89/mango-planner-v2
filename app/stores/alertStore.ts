import type { ColorPalette } from '@bobbykim/manguito-theme'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAlertStore = defineStore('alert', () => {
  const alert = ref<string | null>(null)
  const alertColor = ref<Partial<ColorPalette>>('danger')
  // only one pending clear: a new alert must not be cleared by an older alert's timer
  let clearTimer: ReturnType<typeof setTimeout> | undefined
  const clearAlert = (timeout: number = 5000) => {
    clearTimeout(clearTimer)
    clearTimer = setTimeout(() => {
      alert.value = null
      alertColor.value = 'danger'
    }, timeout)
  }
  /** Clears the alert now, e.g. from its close button (#31). */
  const dismissAlert = () => {
    clearTimeout(clearTimer)
    alert.value = null
    alertColor.value = 'danger'
  }
  const setAlert = (
    message: string,
    color: Partial<ColorPalette> = 'danger',
  ) => {
    if (alert.value) {
      alert.value = null
      alertColor.value = 'danger'
    }
    alert.value = message
    alertColor.value = color
    clearAlert()
  }
  return { alert, alertColor, clearAlert, dismissAlert, setAlert }
})
