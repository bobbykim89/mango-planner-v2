import { describe, expect, it } from 'vitest'
import { api, createUser, expectError, expectOk, fieldsOf } from '../utils/api'

const newPlan = async (token: string, body: Record<string, unknown> = {}) => {
  const res = await api('POST', '/api/plan', {
    token,
    body: { title: 'A plan', content: 'notes', type: 'work', ...body },
  })
  expectOk(res)
  return res.json.data as { _id: string; title: string; complete: boolean }
}

describe('plan routes', () => {
  it('lists the user’s plans (list-ok)', async () => {
    const user = await createUser()
    await newPlan(user.token)
    const res = await api('GET', '/api/plan', { token: user.token })
    expectOk(res)
    expect(Array.isArray(res.json.data)).toBe(true)
    expect(res.json.data).toHaveLength(1)
  })

  it('creates a plan with a trimmed title (create-ok)', async () => {
    const user = await createUser()
    const plan = await newPlan(user.token, { title: '  T  ' })
    expect(plan.title).toBe('T')
  })

  it('lists every invalid field (create-validation)', async () => {
    const user = await createUser()
    const res = await api('POST', '/api/plan', {
      token: user.token,
      body: { title: '', type: 'bogus', content: 'x'.repeat(10_001) },
    })
    expectError(res, 400, 'VALIDATION_FAILED')
    expect(Object.keys(fieldsOf(res)).sort()).toEqual([
      'content',
      'title',
      'type',
    ])
  })

  it('updates and toggles a plan (update-ok, toggle-ok)', async () => {
    const user = await createUser()
    const plan = await newPlan(user.token)
    const updated = await api('PUT', `/api/plan/${plan._id}`, {
      token: user.token,
      body: { title: 'Renamed', content: 'new', type: 'chore' },
    })
    expectOk(updated)
    expect(updated.json.data.title).toBe('Renamed')
    const toggled = await api('PUT', `/api/plan/${plan._id}/toggle`, {
      token: user.token,
      body: { complete: true },
    })
    expectOk(toggled)
    expect(toggled.json.data.complete).toBe(true)
  })

  it('deletes a plan and returns its id (delete-ok)', async () => {
    const user = await createUser()
    const plan = await newPlan(user.token)
    const res = await api('DELETE', `/api/plan/${plan._id}`, {
      token: user.token,
    })
    expectOk(res)
    expect(res.json.data).toEqual({ id: plan._id })
    const list = await api('GET', '/api/plan', { token: user.token })
    expect(list.json.data).toHaveLength(0)
  })

  it('rejects an invalid id (bad-id)', async () => {
    const user = await createUser()
    const res = await api('PUT', '/api/plan/not-an-id', {
      token: user.token,
      body: { title: 'x', type: 'work' },
    })
    expectError(res, 400, 'INVALID_ID')
  })

  it('reports a missing plan (missing-id)', async () => {
    const user = await createUser()
    const res = await api('DELETE', '/api/plan/64b7f0f0f0f0f0f0f0f0f0f0', {
      token: user.token,
    })
    expectError(res, 404, 'PLAN_NOT_FOUND')
  })

  it('forbids changing another user’s plan without logging them out (other-users-plan)', async () => {
    const a = await createUser()
    const b = await createUser()
    const plan = await newPlan(b.token, { title: 'B owns this' })
    expectError(
      await api('PUT', `/api/plan/${plan._id}`, {
        token: a.token,
        body: { title: 'stolen', type: 'work' },
      }),
      403,
      'FORBIDDEN',
    )
    expectError(
      await api('PUT', `/api/plan/${plan._id}/toggle`, {
        token: a.token,
        body: { complete: true },
      }),
      403,
      'FORBIDDEN',
    )
    expectError(
      await api('DELETE', `/api/plan/${plan._id}`, { token: a.token }),
      403,
      'FORBIDDEN',
    )
    const list = await api('GET', '/api/plan', { token: b.token })
    expect(list.json.data[0]).toMatchObject({
      title: 'B owns this',
      complete: false,
    })
  })

  it('rejects malformed JSON (malformed-json)', async () => {
    const user = await createUser()
    const res = await api('POST', '/api/plan', {
      token: user.token,
      raw: '{"title":',
      headers: { 'content-type': 'application/json' },
    })
    expectError(res, 400, 'BAD_REQUEST')
  })

  it('requires a token (no-token)', async () => {
    expectError(await api('GET', '/api/plan'), 401, 'AUTH_TOKEN_MISSING')
  })
})
