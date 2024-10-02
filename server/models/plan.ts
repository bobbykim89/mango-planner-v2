import { Schema, model, type Document } from 'mongoose'
import { TypeInputLiteralType } from '@/types'

const modelName: string = 'plan'

export interface PlanModel extends Document {
  title: string
  content: string
  author: Schema.Types.ObjectId
  complete: boolean
  type: TypeInputLiteralType
  date: Date
  updatedAt: Date
}

const planSchema = new Schema<PlanModel>({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'user',
  },
  complete: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

export const Plan = model<PlanModel>(modelName, planSchema)
