import { z } from 'zod'
import { nameSchema } from './userInput.dto'

export const usernameSchema = z.object({
  username: nameSchema,
})

export type NewUsernameInput = z.infer<typeof usernameSchema>
