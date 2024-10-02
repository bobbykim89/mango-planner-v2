import { Schema, model, Document } from 'mongoose'

const modelName: string = 'user'

export interface UserModel extends Document {
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
