import { Schema, model, type HydratedDocument, type Types } from 'mongoose'

const modelName: string = 'token'

export interface TokenModel {
  _id: Types.ObjectId
  userId: Types.ObjectId
  token: string
  createAt: Date
}

export type TokenDocument = HydratedDocument<TokenModel>

const tokenSchema = new Schema<TokenModel>({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'user',
  },
  // SHA-256 hash of the reset token; the raw token only ever appears in the email link
  token: {
    type: String,
    required: true,
  },
  createAt: {
    type: Date,
    default: Date.now,
    expires: 3600,
  },
})

export const Token = model<TokenModel>(modelName, tokenSchema)
