import jwt from 'jsonwebtoken'
import { describe, expect, it } from 'vitest'
import {
  api,
  createUser,
  expectError,
  expectOk,
  fieldsOf,
  login,
  TEST_PASSWORD,
} from '../utils/api'
import { db, insertLegacyUser } from '../utils/db'

const uid = () => `${Date.now()}-${Math.floor(Math.random() * 1e6)}`

describe('POST /api/auth (login)', () => {
  it('returns a bearer token (login-ok)', async () => {
    const user = await createUser()
    const res = await api('POST', '/api/auth', {
      body: { email: user.email, password: user.password },
    })
    expectOk(res)
    expect(res.json.data.accessToken).toMatch(/^Bearer /)
  })

  it('rejects a wrong password (login-wrong-password)', async () => {
    const user = await createUser()
    const res = await api('POST', '/api/auth', {
      body: { email: user.email, password: 'Wrong-pass1!' },
    })
    expectError(res, 401, 'AUTH_INVALID_CREDENTIALS')
    expect(res.json.error.message).toBe("That email or password isn't right.")
  })

  it('gives the same answer for an unknown email (login-unknown-email)', async () => {
    const res = await api('POST', '/api/auth', {
      body: { email: `nobody-${uid()}@test.local`, password: 'Wrong-pass1!' },
    })
    expectError(res, 401, 'AUTH_INVALID_CREDENTIALS')
    expect(res.json.error.message).toBe("That email or password isn't right.")
  })

  it('ignores email capitalisation and stores emails lowercase (login-mixed-case)', async () => {
    const id = uid()
    await createUser({ email: `Mixed-${id}@Test.Local` })
    const conn = await db()
    const stored = await conn.connection
      .collection('users')
      .findOne({ email: `mixed-${id}@test.local` })
    expect(stored).not.toBeNull()
    await expect(
      login(`MIXED-${id}@TEST.LOCAL`, TEST_PASSWORD),
    ).resolves.toMatch(/^Bearer /)
  })

  it('still logs in accounts stored with capitals (login-exact-legacy)', async () => {
    const id = uid()
    const email = `Legacy.User-${id}@Test.Local`
    await insertLegacyUser({ email, password: TEST_PASSWORD })
    await expect(login(email, TEST_PASSWORD)).resolves.toMatch(/^Bearer /)
    await expect(login(email.toLowerCase(), TEST_PASSWORD)).resolves.toMatch(
      /^Bearer /,
    )
  })

  it('keeps accounts that differ only by case apart (login-case-twins)', async () => {
    const id = uid()
    const a = `Twin-${id}@Test.Local`
    const b = `TWIN-${id}@test.local`
    await insertLegacyUser({ email: a, password: 'Twin-one1!' })
    await insertLegacyUser({ email: b, password: 'Twin-two2!' })
    await expect(login(a, 'Twin-one1!')).resolves.toMatch(/^Bearer /)
    await expect(login(b, 'Twin-two2!')).resolves.toMatch(/^Bearer /)
    const ambiguous = await api('POST', '/api/auth', {
      body: { email: `twin-${id}@test.local`, password: 'Twin-one1!' },
    })
    expectError(ambiguous, 401, 'AUTH_INVALID_CREDENTIALS')
  })

  it('lists invalid fields (login-validation)', async () => {
    const res = await api('POST', '/api/auth', { body: { email: 'nope' } })
    expectError(res, 400, 'VALIDATION_FAILED')
    expect(Object.keys(fieldsOf(res)).sort()).toEqual(['email', 'password'])
  })

  it('rejects malformed JSON (malformed-json)', async () => {
    const res = await api('POST', '/api/auth', {
      raw: '{"email":',
      headers: { 'content-type': 'application/json' },
    })
    expectError(res, 400, 'BAD_REQUEST')
  })
})

describe('GET /api/auth (current user)', () => {
  it('returns the user without the password (me-ok)', async () => {
    const user = await createUser()
    const res = await api('GET', '/api/auth', { token: user.token })
    expectOk(res)
    expect(res.json.data.email).toBe(user.email)
    expect(res.json.data).not.toHaveProperty('password')
  })

  it('requires a token (me-missing-token)', async () => {
    expectError(await api('GET', '/api/auth'), 401, 'AUTH_TOKEN_MISSING')
  })

  it('rejects a malformed token (me-bad-token)', async () => {
    expectError(
      await api('GET', '/api/auth', { token: 'Bearer x' }),
      401,
      'AUTH_TOKEN_INVALID',
    )
  })

  it('rejects a token signed with another secret (me-expired-token)', async () => {
    const forged = jwt.sign(
      { id: '64b7f0f0f0f0f0f0f0f0f0f0' },
      'not-the-secret',
    )
    expectError(
      await api('GET', '/api/auth', { token: `Bearer ${forged}` }),
      401,
      'AUTH_TOKEN_INVALID',
    )
    const expired = jwt.sign(
      { id: '64b7f0f0f0f0f0f0f0f0f0f0' },
      'test-secret',
      {
        expiresIn: -10,
      },
    )
    expectError(
      await api('GET', '/api/auth', { token: `Bearer ${expired}` }),
      401,
      'AUTH_TOKEN_INVALID',
    )
  })
})

describe('POST /api/user (signup)', () => {
  it('rejects an email that differs only by case (signup-duplicate-case)', async () => {
    const user = await createUser()
    const res = await api('POST', '/api/user', {
      body: {
        name: 'Dup',
        email: user.email.toUpperCase(),
        password: TEST_PASSWORD,
      },
    })
    expectError(res, 409, 'EMAIL_IN_USE')
  })

  it('lists invalid fields (signup-validation)', async () => {
    const res = await api('POST', '/api/user', {
      body: { name: '', email: `v-${uid()}@test.local`, password: 'abc' },
    })
    expectError(res, 400, 'VALIDATION_FAILED')
    const fields = fieldsOf(res)
    expect(fields.password).toMatch(/8 characters/)
    expect(fields.name).toBeTruthy()
  })

  it('accepts any non-alphanumeric character as the special character (signup-special-any)', async () => {
    const res = await api('POST', '/api/user', {
      body: {
        name: 'Special',
        email: `s-${uid()}@test.local`,
        password: 'Abcdef1?',
      },
    })
    expectOk(res)
  })
})

describe('PUT /api/user/*', () => {
  it('limits the username length and returns the updated user (username-limits)', async () => {
    const user = await createUser()
    const tooLong = await api('PUT', '/api/user/username', {
      token: user.token,
      body: { username: 'x'.repeat(51) },
    })
    expectError(tooLong, 400, 'VALIDATION_FAILED')
    expect(fieldsOf(tooLong).username).toBeTruthy()
    expect(tooLong.json.error.message).toBe(
      'Usernames can be at most 50 characters.',
    )
    const ok = await api('PUT', '/api/user/username', {
      token: user.token,
      body: { username: '  New Name  ' },
    })
    expectOk(ok)
    expect(ok.json.data.name).toBe('New Name')
    expect(ok.json.data).not.toHaveProperty('password')
  })

  it('reports a wrong current password as a field error, not 401 (password-wrong-current)', async () => {
    const user = await createUser()
    const res = await api('PUT', '/api/user/password', {
      token: user.token,
      body: { currentPassword: 'Wrong-pass1!', newPassword: 'Another1!' },
    })
    expectError(res, 400, 'VALIDATION_FAILED')
    expect(fieldsOf(res).currentPassword).toBeTruthy()
    // forms that only show an alert need the specific message (review: Important 2)
    expect(res.json.error.message).toBe("Your current password isn't right.")
    const changed = await api('PUT', '/api/user/password', {
      token: user.token,
      body: { currentPassword: user.password, newPassword: 'Another1!' },
    })
    expectOk(changed)
    expect(changed.json.data).toBeNull()
    await expect(login(user.email, 'Another1!')).resolves.toMatch(/^Bearer /)
  })
})
