import { Schema, model, Document, type Types } from 'mongoose'

const modelName: string = 'user'

export interface UserModel extends Document {
  _id: Types.ObjectId
  name: string
  email: string
  password: string
  date: Date
}

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
  date: {
    type: Date,
    default: Date.now,
  },
})

export const User = model<UserModel>(modelName, userSchema)
