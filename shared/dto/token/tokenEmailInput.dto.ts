import { z } from 'zod'
import { emailInputSchema } from '../user/userInput.dto'

// The reset link's base URL comes from server config, never from the request.
export const tokenEmailInputSchema = z.object({
  email: emailInputSchema,
})

export type TokenEmailInput = z.infer<typeof tokenEmailInputSchema>
