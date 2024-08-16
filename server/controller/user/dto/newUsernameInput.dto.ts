import { z } from 'zod'

export const usernameSchema = z.object({
  username: z.string(),
})

export type NewUsernameInput = z.infer<typeof usernameSchema>
// export interface NewUsernameInput {
//   username: string
// }
