import { describe, expect, it } from 'vitest'
import { api } from '../utils/api'
import { db } from '../utils/db'

describe('test harness', () => {
  it('serves the API', async () => {
    const res = await api('GET', '/api/does-not-exist')
    expect(res.status).toBe(404)
  })

  it('connects to the memory database', async () => {
    const conn = await db()
    await expect(
      conn.connection.db!.listCollections().toArray(),
    ).resolves.toBeInstanceOf(Array)
  })
})
