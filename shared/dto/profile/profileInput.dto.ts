import { z } from 'zod'
import { objectIdString } from '../common'

export const profileInputSchema = z.object({
  plansOrder: z
    .array(objectIdString, { error: 'Expected a list of plan ids.' })
    .max(1000, 'The plan order can have at most 1,000 plans.'),
})

export const profileInputDarkSchema = z.object({
  dark: z.boolean({ error: 'Please say whether dark mode is on.' }),
})

export type ProfileInput = z.infer<typeof profileInputSchema>
export type ProfileInputDark = z.infer<typeof profileInputDarkSchema>
