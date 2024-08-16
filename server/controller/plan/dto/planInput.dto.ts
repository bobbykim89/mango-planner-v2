import { z } from 'zod'

// export interface PlanInput {
//   title: string
//   content?: string
//   complete?: boolean
//   type: string
// }

export const planInputSchema = z.object({
  title: z.string(),
  content: z.optional(z.string()),
  complete: z.optional(z.boolean()),
  type: z.string(),
})

export const planInputCompleteSchema = z.object({
  complete: z.boolean(),
})

export type PlanInput = z.infer<typeof planInputSchema>

export type PlanInputComplete = z.infer<typeof planInputCompleteSchema>
