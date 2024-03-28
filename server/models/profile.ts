import { Schema, model } from 'mongoose'

const profileSchema = new Schema({
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

export const Profile = model('profile', profileSchema)
