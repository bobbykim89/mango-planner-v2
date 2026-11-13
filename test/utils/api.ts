import { readFileSync } from 'node:fs'
import { expect, inject } from 'vitest'

export interface ApiResult {
  status: number
  json: any
  headers: Headers
}

// Each test file loads this module afresh while the database (and its rate-limit
// counters) is shared, so start every file at a random point to avoid reusing IPs.
let ipCounter = Math.floor(Math.random() * 0xffff) << 8
const uniqueIp = () => {
  ipCounter += 1
  return `10.${(ipCounter >> 16) & 255}.${(ipCounter >> 8) & 255}.${ipCounter & 255}`
}

/** Calls the test server. Sends a unique x-forwarded-for per call unless one is given. */
export const api = async (
  method: string,
  path: string,
  opts: {
    body?: unknown
    token?: string
    headers?: Record<string, string>
    raw?: string | FormData
  } = {},
): Promise<ApiResult> => {
  const headers: Record<string, string> = {
    'x-forwarded-for': uniqueIp(),
    ...opts.headers,
  }
  if (opts.token) headers.authorization = opts.token
  let body: BodyInit | undefined
  if (opts.raw !== undefined) {
    body = opts.raw
  } else if (opts.body !== undefined) {
    body = JSON.stringify(opts.body)
    headers['content-type'] ??= 'application/json'
  }
  const res = await fetch(`${inject('baseUrl')}${path}`, {
    method,
    headers,
    body,
  })
  const text = await res.text()
  let json: any = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = text
  }
  return { status: res.status, json, headers: res.headers }
}

let userCounter = 0
export const TEST_PASSWORD = 'Testing1!'

/** Logs in and returns the "Bearer …" token, from either response shape. */
export const login = async (
  email: string,
  password: string,
): Promise<string> => {
  const res = await api('POST', '/api/auth', { body: { email, password } })
  const token = res.json?.data?.accessToken ?? res.json?.access_token
  if (!token)
    throw new Error(
      `login failed for ${email}: ${res.status} ${JSON.stringify(res.json)}`,
    )
  return token
}

/** Signs up a unique user through the API. */
export const createUser = async (
  overrides: { email?: string; password?: string; name?: string } = {},
): Promise<{ id: string; email: string; password: string; token: string }> => {
  userCounter += 1
  const email =
    overrides.email ?? `user-${Date.now()}-${userCounter}@test.local`
  const password = overrides.password ?? TEST_PASSWORD
  const name = overrides.name ?? `User ${userCounter}`
  const res = await api('POST', '/api/user', {
    body: { name, email, password },
  })
  const token = res.json?.data?.accessToken ?? res.json?.access_token
  if (!token)
    throw new Error(`signup failed: ${res.status} ${JSON.stringify(res.json)}`)
  const me = await api('GET', '/api/auth', { token })
  const user = me.json?.data ?? me.json
  return { id: String(user._id), email, password, token }
}

export const expectOk = (res: ApiResult, status = 200) => {
  expect(res.status, JSON.stringify(res.json)).toBe(status)
  expect(Object.keys(res.json).sort()).toEqual(['data', 'ok'])
  expect(res.json.ok).toBe(true)
}

export const expectError = (res: ApiResult, status: number, code: string) => {
  expect(res.status, JSON.stringify(res.json)).toBe(status)
  expect(Object.keys(res.json).sort()).toEqual(['error', 'ok'])
  expect(res.json.ok).toBe(false)
  expect(res.json.error.code).toBe(code)
  expect(typeof res.json.error.message).toBe('string')
  const keys = Object.keys(res.json.error).sort()
  expect(
    keys.filter((k) => !['code', 'fields', 'message'].includes(k)),
  ).toEqual([])
}

export const fieldsOf = (res: ApiResult): Record<string, string> =>
  Object.fromEntries(
    (res.json?.error?.fields ?? []).map(
      (f: { field: string; message: string }) => [f.field, f.message],
    ),
  )

/** Texts of mails the server logged to `to`, oldest first. */
export const readMail = async (to: string): Promise<string[]> => {
  await new Promise((r) => setTimeout(r, 200))
  const log = readFileSync(inject('serverLog'), 'utf8')
  const out: string[] = []
  for (const line of log.split('\n')) {
    const m = line.match(/\[mail\] to=(\S+) text=(.*)$/)
    if (m && m[1] === to) out.push(m[2]!.replace(/\\n/g, '\n'))
  }
  return out
}
