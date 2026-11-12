import { z } from 'zod'

/** A MongoDB ObjectId as a 24-character hex string (no mongoose import, so it is safe for client code). */
export const objectIdString = z
  .string({ error: 'Expected an id.' })
  .regex(/^[a-f0-9]{24}$/i, "That id isn't valid.")
