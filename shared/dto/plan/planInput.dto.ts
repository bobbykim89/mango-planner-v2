import { z } from 'zod'

export const planTypes = ['personal', 'work', 'chore'] as const

export const planInputSchema = z.object({
  title: z
    .string({ error: 'Please give the plan a title.' })
    .trim()
    .min(1, 'Please give the plan a title.')
    .max(200, 'Titles can be at most 200 characters.'),
  content: z
    .string()
    .max(10_000, 'Plan details can be at most 10,000 characters.')
    .optional(),
  complete: z.boolean().optional(),
  type: z.enum(planTypes, { error: 'Please choose personal, work or chore.' }),
})

export const planInputCompleteSchema = z.object({
  complete: z.boolean({ error: 'Please say whether the plan is complete.' }),
})

export type PlanInput = z.infer<typeof planInputSchema>
export type PlanInputComplete = z.infer<typeof planInputCompleteSchema>
