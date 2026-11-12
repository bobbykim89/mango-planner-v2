import { describe, expect, it } from 'vitest'
import { api, createUser, expectError, expectOk } from '../utils/api'

const ip = (n: number) => ({ 'x-forwarded-for': `203.0.113.${n}` })

describe('rate limiting', () => {
  it('limits login attempts per IP (login-limit, login-other-ip-unaffected)', async () => {
    const user = await createUser()
    for (let i = 0; i < 10; i++) {
      const res = await api('POST', '/api/auth', {
        headers: ip(10),
        body: { email: user.email, password: 'Wrong-pass1!' },
      })
      expectError(res, 401, 'AUTH_INVALID_CREDENTIALS')
    }
    const limited = await api('POST', '/api/auth', {
      headers: ip(10),
      body: { email: user.email, password: user.password },
    })
    expectError(limited, 429, 'RATE_LIMITED')
    const retryAfter = Number(limited.headers.get('retry-after'))
    expect(retryAfter).toBeGreaterThan(0)
    expect(retryAfter).toBeLessThanOrEqual(900)

    const elsewhere = await api('POST', '/api/auth', {
      headers: ip(11),
      body: { email: user.email, password: user.password },
    })
    expectOk(elsewhere)
  })

  it('limits reset emails per address across IPs (send-token-email-limit)', async () => {
    const user = await createUser()
    for (let i = 0; i < 3; i++) {
      expectOk(
        await api('POST', '/api/token/send-token', {
          headers: ip(20 + i),
          body: { email: user.email },
        }),
      )
    }
    const limited = await api('POST', '/api/token/send-token', {
      headers: ip(30),
      body: { email: user.email.toUpperCase() },
    })
    expectError(limited, 429, 'RATE_LIMITED')
  })

  it('counts rejected signups too (signup-limit)', async () => {
    for (let i = 0; i < 5; i++) {
      const res = await api('POST', '/api/user', {
        headers: ip(40),
        body: { name: 'x', email: 'not-an-email', password: 'short' },
      })
      expectError(res, 400, 'VALIDATION_FAILED')
    }
    const limited = await api('POST', '/api/user', {
      headers: ip(40),
      body: { name: 'x', email: 'not-an-email', password: 'short' },
    })
    expectError(limited, 429, 'RATE_LIMITED')
  })
})
