import { inject } from 'vitest'
import { describe, expect, it } from 'vitest'
import { api, createUser, expectError } from '../utils/api'

describe('API core', () => {
  it('returns the envelope for unknown /api routes (unknown-route)', async () => {
    const res = await api('GET', '/api/does-not-exist')
    expectError(res, 404, 'NOT_FOUND')
    expect(res.json.error.message).toBe(
      "We couldn't find what you were looking for.",
    )
  })

  it('renders an authenticated page on the server through the client wrapper (ssr-wrapper)', async () => {
    const user = await createUser({ name: 'Wrapper Tester' })
    const res = await fetch(`${inject('baseUrl')}/`, {
      headers: { cookie: `access_token=${encodeURIComponent(user.token)}` },
      redirect: 'manual',
    })
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('Wrapper Tester')
  })
})
