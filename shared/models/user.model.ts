import { Schema, model, type HydratedDocument, type Types } from 'mongoose'

const modelName: string = 'user'

export interface UserModel {
  _id: Types.ObjectId
  name: string
  email: string
  password: string
  createdAt: Date
}

export type UserDocument = HydratedDocument<UserModel>

const userSchema = new Schema<UserModel>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  // older documents stored this as `date`; scripts/migrate-created-at.ts renames them
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export const User = model<UserModel>(modelName, userSchema)
