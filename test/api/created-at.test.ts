import { describe, expect, it } from 'vitest'
import { migrateCreatedAt } from '../../scripts/migrate-created-at'
import { api, createUser, expectOk } from '../utils/api'
import { db } from '../utils/db'

describe('plans and users are stamped with createdAt', () => {
  it('a new plan has createdAt and no date', async () => {
    const user = await createUser()
    const res = await api('POST', '/api/plan', {
      token: user.token,
      body: { title: 'Stamped', content: '', type: 'work' },
    })
    expectOk(res)
    expect(res.json.data).toHaveProperty('createdAt')
    expect(res.json.data).not.toHaveProperty('date')
  })

  it('a new user has createdAt and no date', async () => {
    const user = await createUser()
    const res = await api('GET', '/api/auth', { token: user.token })
    expectOk(res)
    expect(res.json.data).toHaveProperty('createdAt')
    expect(res.json.data).not.toHaveProperty('date')
  })
})

describe('migrateCreatedAt: date → createdAt on existing documents', () => {
  const insertOld = async () => {
    const conn = await db()
    const created = new Date('2024-03-05T06:07:08.000Z')
    const user = await conn.connection.collection('users').insertOne({
      name: 'Old user',
      email: `old-${Date.now()}-${Math.random()}@test.local`,
      password: 'x',
      date: created,
    })
    const plan = await conn.connection.collection('plans').insertOne({
      title: 'Old plan',
      content: '',
      author: user.insertedId,
      complete: false,
      type: 'work',
      date: created,
      updatedAt: new Date(),
    })
    const read = async () => ({
      user: await conn.connection
        .collection('users')
        .findOne({ _id: user.insertedId }),
      plan: await conn.connection
        .collection('plans')
        .findOne({ _id: plan.insertedId }),
    })
    return { created, conn, read }
  }

  it('moves the original value and drops date', async () => {
    const { created, conn, read } = await insertOld()
    await migrateCreatedAt(conn.connection.db!)
    const { user, plan } = await read()
    for (const doc of [user, plan]) {
      expect(doc?.createdAt).toEqual(created)
      expect(doc).not.toHaveProperty('date')
    }
  })

  it('reports the documents it moved, and does nothing on a second run', async () => {
    const { conn } = await insertOld()
    const first = await migrateCreatedAt(conn.connection.db!)
    expect(first.plans.renamed).toBeGreaterThanOrEqual(1)
    expect(first.users.renamed).toBeGreaterThanOrEqual(1)
    const second = await migrateCreatedAt(conn.connection.db!)
    expect(second.plans.renamed).toBe(0)
    expect(second.users.renamed).toBe(0)
  })

  it('a dry run counts but writes nothing', async () => {
    const { created, conn, read } = await insertOld()
    const report = await migrateCreatedAt(conn.connection.db!, {
      dryRun: true,
    })
    expect(report.plans.pending).toBeGreaterThanOrEqual(1)
    expect(report.plans.renamed).toBe(0)
    const { plan } = await read()
    expect(plan?.date).toEqual(created)
    expect(plan).not.toHaveProperty('createdAt')
  })
})
