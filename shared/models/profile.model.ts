import { Schema, model, type HydratedDocument, type Types } from 'mongoose'
// import type { UserModel } from './user.model'

const modelName: string = 'profile'

export interface ProfileModel {
  _id: Types.ObjectId
  user: Types.ObjectId //| UserModel
  profilePicture: string
  plansOrder: string[]
  dark: boolean
  createdAt: Date
  updatedAt: Date
}

export type ProfileDocument = HydratedDocument<ProfileModel>

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
