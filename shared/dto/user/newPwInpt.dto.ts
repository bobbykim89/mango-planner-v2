import { z } from 'zod'
import { passwordSchema } from './userInput.dto'

export const pwUpdateInputSchema = z.object({
  currentPassword: z.string(),
  newPassword: passwordSchema,
})

export type PwUpdateInput = z.infer<typeof pwUpdateInputSchema>
// export interface PwUpdateInput {
//   currentPassword: string
//   newPassword: string
// }
