import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import {
  api,
  createUser,
  expectError,
  expectOk,
  fieldsOf,
  login,
  readMail,
} from '../utils/api'
import { db } from '../utils/db'

const LINK = /(https?:\/\/\S+\/auth\/reset-password\?user=(\w+)&token=(\w+))/

const requestReset = (email: string, extra: Record<string, unknown> = {}) =>
  api('POST', '/api/token/send-token', { body: { email, ...extra } })

const lastLink = async (email: string) => {
  const mails = await readMail(email)
  const m = mails.at(-1)?.match(LINK)
  if (!m) throw new Error(`no reset link mailed to ${email}`)
  return { url: m[1]!, userId: m[2]!, token: m[3]! }
}

const reset = (userId: string, token: string, password: string) =>
  api('POST', '/api/token/reset-password', {
    body: { userId, token, password },
  })

describe('password reset', () => {
  it('answers the same for unknown emails (unknown-email-generic)', async () => {
    const user = await createUser()
    const unknownEmail = `nobody-${Date.now()}@test.local`
    const unknown = await requestReset(unknownEmail)
    const known = await requestReset(user.email)
    expectOk(unknown)
    expect(unknown.json).toEqual({ ok: true, data: null })
    expect(known.status).toBe(unknown.status)
    expect(known.json).toEqual(unknown.json)
    expect(await readMail(unknownEmail)).toEqual([])
  })

  it('builds the link from server config, not the request (known-email-link)', async () => {
    const user = await createUser()
    expectOk(await requestReset(user.email, { url: 'https://evil.example' }))
    const link = await lastLink(user.email)
    expect(link.url.startsWith('https://app.test/auth/reset-password?')).toBe(
      true,
    )
    expect(link.token).toMatch(/^[a-f0-9]{64}$/)
    expect(link.userId).toBe(user.id)
  })

  it('stores only a hash of the token (token-stored-hashed)', async () => {
    const user = await createUser()
    await requestReset(user.email)
    const { token } = await lastLink(user.email)
    const conn = await db()
    const stored = await conn.connection
      .collection('tokens')
      .findOne({ userId: new conn.Types.ObjectId(user.id) })
    expect(stored?.token).toBe(createHash('sha256').update(token).digest('hex'))
    expect(stored?.token).not.toBe(token)
  })

  it('resets the password once per link (reset-ok, token-single-use)', async () => {
    const user = await createUser()
    await requestReset(user.email)
    const { userId, token } = await lastLink(user.email)
    const res = await reset(userId, token, 'Brand-new1!')
    expectOk(res)
    expect(res.json.data).toBeNull()
    await expect(login(user.email, 'Brand-new1!')).resolves.toMatch(/^Bearer /)
    expectError(
      await api('POST', '/api/auth', {
        body: { email: user.email, password: user.password },
      }),
      401,
      'AUTH_INVALID_CREDENTIALS',
    )
    expectError(
      await reset(userId, token, 'Another-new1!'),
      400,
      'RESET_TOKEN_INVALID',
    )
  })

  it('invalidates an older link when a new one is requested (token-replaced)', async () => {
    const user = await createUser()
    await requestReset(user.email)
    const first = await lastLink(user.email)
    await requestReset(user.email)
    const second = await lastLink(user.email)
    expect(second.token).not.toBe(first.token)
    expectError(
      await reset(first.userId, first.token, 'Brand-new1!'),
      400,
      'RESET_TOKEN_INVALID',
    )
    expectOk(await reset(second.userId, second.token, 'Brand-new1!'))
  })

  it('validates the token format (token-bad-format)', async () => {
    const user = await createUser()
    const res = await reset(user.id, 'abc', 'Brand-new1!')
    expectError(res, 400, 'VALIDATION_FAILED')
    expect(fieldsOf(res).token).toBeTruthy()
  })

  it('finds the account regardless of email case (mixed-case-email)', async () => {
    const user = await createUser()
    expectOk(await requestReset(user.email.toUpperCase()))
    await expect(lastLink(user.email)).resolves.toMatchObject({
      userId: user.id,
    })
  })
})
