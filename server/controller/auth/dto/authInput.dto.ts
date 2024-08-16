import { z } from 'zod'

export const authInputSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string(),
})

export type AuthInput = z.infer<typeof authInputSchema>

// export interface AuthInput {
//   email: string;
//   password: string;
// }
