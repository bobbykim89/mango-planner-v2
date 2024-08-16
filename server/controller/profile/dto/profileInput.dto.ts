import { z } from 'zod'

// export interface ProfileInput {
//   plansOrder: string[]
//   dark: boolean
// }

export const profileInputSchema = z.object({
  plansOrder: z.string().array(),
  dark: z.optional(z.boolean()),
})

export const profileInputDarkSchema = z.object({
  dark: z.boolean(),
})

export type ProfileInput = z.infer<typeof profileInputSchema>

export type ProfileInputDark = z.infer<typeof profileInputDarkSchema>
