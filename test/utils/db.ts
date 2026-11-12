import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { inject } from 'vitest'

let connected: Promise<typeof mongoose> | null = null

/** Mongoose connected to the in-memory test database. */
export const db = (): Promise<typeof mongoose> => {
  connected ??= mongoose.connect(inject('mongoUri'))
  return connected
}

/** Inserts a user directly, as an account created before email normalization would be. */
export const insertLegacyUser = async ({
  email,
  password,
  name = 'Legacy User',
}: {
  email: string
  password: string
  name?: string
}): Promise<{ id: string }> => {
  const conn = await db()
  const hash = await bcrypt.hash(password, 10)
  const res = await conn.connection
    .collection('users')
    .insertOne({ name, email, password: hash, date: new Date() })
  await conn.connection.collection('profiles').insertOne({
    user: res.insertedId,
    profilePicture: '',
    plansOrder: [],
    dark: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  return { id: res.insertedId.toString() }
}
