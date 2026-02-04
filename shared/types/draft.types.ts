import { PlanFormInput } from './NewFormInput.types'
import { PlanInput } from './PlanInput.types'

export interface DraftRawType {
  data: PlanFormInput
  timeStamp: Date
}

export interface DraftFormattedType {
  id: string
  data: PlanInput
  timeStamp: Date
}

export interface DraftFormInput {
  id: string
  data: PlanFormInput
}
