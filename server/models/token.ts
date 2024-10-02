import { type Document, Schema, model } from 'mongoose'

const modelName: string = 'token'

export interface TokenModel extends Document {
  userId: Schema.Types.ObjectId
  token: string
  createAt: Date
}

const tokenSchema = new Schema<TokenModel>({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'user',
  },
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
