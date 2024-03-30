import { defineStore } from 'pinia'
import { ref } from 'vue'

// export const useErrorStore = defineStore('error', {
//   state: (): ErrorStateType => ({
//     error: null,
//   }),
//   actions: {
//     setError(message: string) {
//       this.error = message
//       this.clearError()
//     },
//     clearError(timeout: number = 5000) {
//       setTimeout(() => {
//         this.error = null
//       }, timeout)
//     },
//   },
// })

export const useErrorStore = defineStore('error', () => {
  const error = ref<string | null>(null)
  const clearError = (timeout: number = 5000) => {
    setTimeout(() => {
      error.value = null
    }, timeout)
  }
  const setError = (message: string) => {
    error.value = message
    clearError()
  }
  return { error, clearError, setError }
})
