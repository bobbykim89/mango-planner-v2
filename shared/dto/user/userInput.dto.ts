import { z } from 'zod'

import { passwordRules } from './passwordRules'

export { PASSWORD_SPECIAL, passwordRules } from './passwordRules'

export const passwordSchema = passwordRules.reduce(
  (schema, rule) =>
    schema.refine((pw) => rule.test.test(pw), { message: rule.message }),
  z.string({ error: 'Please enter a password.' }),
)

/** Email as entered (trimmed); lookups handle capitalisation themselves. */
export const emailInputSchema = z
  .string({ error: 'Please enter your email address.' })
  .trim()
  .pipe(z.email('Please enter a valid email address.'))

/** Email normalized for storage: trimmed and lowercased. */
export const emailSchema = z
  .string({ error: 'Please enter your email address.' })
  .trim()
  .toLowerCase()
  .pipe(z.email('Please enter a valid email address.'))

export const nameSchema = z
  .string({ error: 'Please enter a username.' })
  .trim()
  .min(1, 'Please enter a username.')
  .max(50, 'Usernames can be at most 50 characters.')

export const userInputSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  password: passwordSchema,
})

export type UserInput = z.infer<typeof userInputSchema>
