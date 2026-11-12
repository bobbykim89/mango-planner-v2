import { describe, expect, it } from 'vitest'
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
})
