import { PlanInput } from './PlanInput.types'

export interface DraftRawType {
  data: PlanInput
  timeStamp: Date
}

export interface DraftFormattedType {
  id: string
  data: PlanInput
  timeStamp: Date
}
