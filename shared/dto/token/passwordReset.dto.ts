import { z } from 'zod'
import { objectIdString } from '../common'
import { passwordSchema } from '../user/userInput.dto'

export const resetPwInputSchema = z.object({
  userId: objectIdString,
  token: z
    .string({ error: 'This reset link is incomplete.' })
    .regex(/^[a-f0-9]{64}$/i, 'This reset link is incomplete.'),
  password: passwordSchema,
})

export type ResetPwInput = z.infer<typeof resetPwInputSchema>
