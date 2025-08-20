import { z } from 'zod'

const validator = {
  email: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/,
}

export const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters long' })
  .refine((pw) => /[A-Z]/.test(pw), {
    message: 'Password must have at least 1 uppercase character',
  })
  .refine((pw) => /[a-z]/.test(pw), {
    message: 'Password must have at least 1 lowercase character',
  })
  .refine((pw) => /[0-9]/.test(pw), {
    message: 'Password must have at least 1 number',
  })
  .refine((pw) => /[!@#$%^&*]/.test(pw), {
    message: 'Password must have at least 1 special character',
  })

export const userInputSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  name: z.string(),
  password: passwordSchema,
})

export type UserInput = z.infer<typeof userInputSchema>
