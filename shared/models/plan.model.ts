import { Schema, model, type HydratedDocument, type Types } from 'mongoose'
import type { TypeInputLiteralType } from '../types'

const modelName: string = 'plan'

export interface PlanModel {
  _id: Types.ObjectId
  title: string
  content: string
  author: Types.ObjectId
  complete: boolean
  type: TypeInputLiteralType
  date: Date
  updatedAt: Date
}

export type PlanDocument = HydratedDocument<PlanModel>

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
