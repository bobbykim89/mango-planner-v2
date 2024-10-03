import { z } from 'zod'
import { passwordSchema } from '../../user/dto'

export const resetPwInputSchema = z.object({
  userId: z.string(),
  token: z.string(),
  password: passwordSchema,
})

export type ResetPwInput = z.infer<typeof resetPwInputSchema>
