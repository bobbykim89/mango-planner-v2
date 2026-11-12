import {
  Plan,
  Profile,
  User,
  type PlanDocument,
  type ProfileDocument,
  type UserDocument,
} from '#shared/models'
import { readBody, type H3Event } from 'h3'
import { isValidObjectId } from 'mongoose'
import type { z, ZodType } from 'zod'

/** Shared lookups and checks for the API controllers. */
export abstract class BaseController {
  /** Reads the JSON body and validates it; Zod errors become VALIDATION_FAILED. */
  protected validateBody = async <S extends ZodType>(
    e: H3Event,
    schema: S,
  ): Promise<z.infer<S>> => {
    let body: unknown
    try {
      body = await readBody(e)
    } catch {
      throw apiError.BAD_REQUEST()
    }
    return schema.parse(body ?? {})
  }

  protected requireObjectId = (id: unknown): string => {
    if (typeof id !== 'string' || !isValidObjectId(id)) {
      throw apiError.INVALID_ID()
    }
    return id
  }

  /** The signed-in user, without the password. */
  protected requireUser = async (e: H3Event): Promise<UserDocument> => {
    const user = await User.findById(e.context.user?.id).select('-password')
    if (!user) throw apiError.USER_NOT_FOUND()
    return user
  }

  protected requireProfile = async (
    userId: string,
  ): Promise<ProfileDocument> => {
    const profile = await Profile.findOne({ user: userId })
    if (!profile) throw apiError.PROFILE_NOT_FOUND()
    return profile
  }

  /** The plan if it exists and belongs to userId; otherwise INVALID_ID, PLAN_NOT_FOUND or FORBIDDEN. */
  protected findOwnedPlan = async (
    planId: unknown,
    userId: string,
  ): Promise<PlanDocument> => {
    const id = this.requireObjectId(planId)
    const plan = await Plan.findById(id)
    if (!plan) throw apiError.PLAN_NOT_FOUND()
    if (plan.author?.toString() !== userId) throw apiError.FORBIDDEN()
    return plan
  }
}
