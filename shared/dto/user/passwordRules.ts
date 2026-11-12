// Password rules shared by the server schema and the client forms.
// Kept free of zod so pages can import them without bundling it.

/** "Special character" means anything that isn't a letter or a digit (same rule on client and server). */
export const PASSWORD_SPECIAL = /[^A-Za-z0-9]/

export const passwordRules: { test: RegExp; message: string }[] = [
  { test: /^.{8,}$/, message: 'Password must be at least 8 characters long' },
  {
    test: /[A-Z]/,
    message: 'Password must have at least 1 uppercase character',
  },
  {
    test: /[a-z]/,
    message: 'Password must have at least 1 lowercase character',
  },
  { test: /[0-9]/, message: 'Password must have at least 1 number' },
  {
    test: PASSWORD_SPECIAL,
    message: 'Password must have at least 1 special character',
  },
]
