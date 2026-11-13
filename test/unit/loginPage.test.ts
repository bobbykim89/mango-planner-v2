import { mountSuspended } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LoginPage from '@/pages/auth/login.vue'
import { useAlertStore } from '@/stores'
import { SESSION_EXPIRED_MESSAGE, SESSION_EXPIRED_REDIRECT } from '@/utils/session'
import { resetState } from './helpers'

describe('login page', () => {
  beforeEach(() => {
    resetState()
  })
  afterEach(() => {
    // mounted pages use the test app's Pinia, which outlives resetState()
    useAlertStore().dismissAlert()
  })

  it('explains an expired session and drops the reason from the address (#31)', async () => {
    await mountSuspended(LoginPage, { route: SESSION_EXPIRED_REDIRECT })
    await vi.waitFor(() => expect(useRoute().query.reason).toBeUndefined())
    expect(useAlertStore().alert).toBe(SESSION_EXPIRED_MESSAGE)
    expect(useAlertStore().alertColor).toBe('danger')
  })

  it('says nothing about expiry on a normal visit', async () => {
    await mountSuspended(LoginPage, { route: '/auth/login' })
    // (the test app opens '/' first, whose middleware posts its own alert)
    expect(useAlertStore().alert).not.toBe(SESSION_EXPIRED_MESSAGE)
  })
})
