import { z } from 'zod'
import { emailInputSchema } from '../user/userInput.dto'

export const authInputSchema = z.object({
  email: emailInputSchema,
  password: z
    .string({ error: 'Please enter your password.' })
    .min(1, 'Please enter your password.'),
})

export type AuthInput = z.infer<typeof authInputSchema>
