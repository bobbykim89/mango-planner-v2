import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { inject } from 'vitest'
import { api, createUser, expectError, fieldsOf } from '../utils/api'

// The success path calls the real OpenWeather API, so it is covered by the UI smoke run instead.
describe('GET /api/weather', () => {
  it('requires a session (no-token)', async () => {
    expectError(
      await api('GET', '/api/weather?lat=33.45&lon=-112.07'),
      401,
      'AUTH_TOKEN_MISSING',
    )
  })

  it('validates the coordinates (bad-coords)', async () => {
    const user = await createUser()
    const res = await api('GET', '/api/weather?lat=999&lon=-112.07', {
      token: user.token,
    })
    expectError(res, 400, 'VALIDATION_FAILED')
    expect(fieldsOf(res).lat).toBeTruthy()
    const missing = await api('GET', '/api/weather', { token: user.token })
    expectError(missing, 400, 'VALIDATION_FAILED')
    expect(Object.keys(fieldsOf(missing)).sort()).toEqual(['lat', 'lon'])
  })

  it('reports an upstream failure without logging the API key (upstream-error)', async () => {
    // the test server points OpenWeather at an unreachable address (NUXT_OPEN_WEATHER_URL)
    const user = await createUser()
    const res = await api('GET', '/api/weather?lat=33.45&lon=-112.07', {
      token: user.token,
    })
    expectError(res, 502, 'UPSTREAM_ERROR')
    expect(res.json.error.message).toBe('Weather is unavailable right now.')
    await new Promise((r) => setTimeout(r, 200))
    const log = readFileSync(inject('serverLog'), 'utf8')
    expect(log).toContain('[weather]')
    expect(log).not.toContain('appid=')
  })
})
