import { z } from 'zod'
import { passwordSchema } from './userInput.dto'

export const pwUpdateInputSchema = z.object({
  currentPassword: z
    .string({ error: 'Please enter your current password.' })
    .min(1, 'Please enter your current password.'),
  newPassword: passwordSchema,
})

export type PwUpdateInput = z.infer<typeof pwUpdateInputSchema>
