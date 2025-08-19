import { z } from 'zod'

export const authInputSchema = z.object({
  email: z.email({ message: 'Invalid email address' }),
  password: z.string(),
})

export type AuthInput = z.infer<typeof authInputSchema>
