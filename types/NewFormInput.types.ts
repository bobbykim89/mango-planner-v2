import type { PlanInput } from './PlanInput.types'

export type TypeInputLiteralType = 'personal' | 'work' | 'chore'
export interface PlanFormInput extends PlanInput {
  type: TypeInputLiteralType
}
