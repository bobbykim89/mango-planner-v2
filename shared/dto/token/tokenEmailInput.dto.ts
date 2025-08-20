import { z } from 'zod'

export const tokenEmailInputSchema = z.object({
  url: z.string(),
  email: z.email({ message: 'Invalid email address' }),
})

export type TokenEmailInput = z.infer<typeof tokenEmailInputSchema>
