import { Schema, model, type Document, type Types } from 'mongoose'

const modelName: string = 'profile'

export interface ProfileModel extends Document {
  _id: Types.ObjectId
  user: Schema.Types.ObjectId
  profilePicture: string
  plansOrder: string[]
  dark: boolean
  createdAt: Date
  updatedAt: Date
}

const profileSchema = new Schema<ProfileModel>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user',
  },
  profilePicture: {
    type: String,
    default: '',
  },
  plansOrder: {
    type: [String],
    default: [],
  },
  dark: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

export const Profile = model<ProfileModel>(modelName, profileSchema)
