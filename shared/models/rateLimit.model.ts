import { Schema, model, type HydratedDocument } from 'mongoose'

const modelName: string = 'rateLimit'

/** A request counter per limiter and client key; MongoDB removes it once the window ends. */
export interface RateLimitModel {
  key: string
  count: number
  resetAt: Date
}

export type RateLimitDocument = HydratedDocument<RateLimitModel>

const rateLimitSchema = new Schema<RateLimitModel>({
  key: { type: String, required: true, unique: true },
  count: { type: Number, required: true, default: 0 },
  resetAt: { type: Date, required: true },
})
rateLimitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 })

export const RateLimit = model<RateLimitModel>(modelName, rateLimitSchema)
