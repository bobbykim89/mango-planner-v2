import { useRuntimeConfig } from '#imports'
import bcrypt from 'bcryptjs'
import { getRequestHeader, type H3Event } from 'h3'
import jwt from 'jsonwebtoken'

/** Signs a session token (HS256, 7 days) for the given user id. */
export const signToken = (id: string): string =>
  jwt.sign({ id }, useRuntimeConfig().jwtSecret, {
    algorithm: 'HS256',
    expiresIn: '7d',
  })

/** Verifies the Authorization header and sets e.context.user = { id }. */
export const requireAuth = (e: H3Event): void => {
  const header = getRequestHeader(e, 'authorization')
  if (!header) throw apiError.AUTH_TOKEN_MISSING()
  const token = header.replace(/^Bearer\s+/i, '')
  try {
    const decoded = jwt.verify(token, useRuntimeConfig().jwtSecret, {
      algorithms: ['HS256'],
    })
    if (typeof decoded !== 'object' || typeof decoded.id !== 'string') {
      throw new Error('token has no user id')
    }
    e.context.user = { id: decoded.id }
  } catch {
    throw apiError.AUTH_TOKEN_INVALID()
  }
}

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}
