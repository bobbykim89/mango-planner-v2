import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAlertStore } from '@/stores'
import { resetState } from './helpers'

describe('alertStore', () => {
  beforeEach(() => {
    resetState()
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps a newer alert for its full 5 s even if an older one was set before', () => {
    const alert = useAlertStore()
    alert.setAlert('first')
    vi.advanceTimersByTime(3000)
    alert.setAlert('second', 'success')
    vi.advanceTimersByTime(2500) // the first alert's timer would fire here
    expect(alert.alert).toBe('second')
    expect(alert.alertColor).toBe('success')
    vi.advanceTimersByTime(2500)
    expect(alert.alert).toBeNull()
    expect(alert.alertColor).toBe('danger')
  })

  it('dismissAlert clears the alert at once (the close button, #31)', () => {
    const alert = useAlertStore()
    alert.setAlert('saved', 'success')
    alert.dismissAlert()
    expect(alert.alert).toBeNull()
    expect(alert.alertColor).toBe('danger')
    // the dismissed alert's pending clear must not cut a newer alert short
    vi.advanceTimersByTime(1000)
    alert.setAlert('next')
    vi.advanceTimersByTime(4500)
    expect(alert.alert).toBe('next')
  })
})
