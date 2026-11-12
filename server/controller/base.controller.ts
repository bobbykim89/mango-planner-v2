import {
  Plan,
  Profile,
  User,
  type PlanDocument,
  type ProfileDocument,
  type UserDocument,
} from '#shared/models'
import { getQuery, readBody, type H3Event } from 'h3'
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
    // text/plain, multipart or JSON with a charset come back unparsed; none is a valid JSON object
    if (
      body !== undefined &&
      body !== null &&
      (typeof body !== 'object' || Array.isArray(body))
    ) {
      throw apiError.BAD_REQUEST()
    }
    return schema.parse(body ?? {})
  }

  /** Validates the query string; Zod errors become VALIDATION_FAILED. */
  protected validateQuery = <S extends ZodType>(
    e: H3Event,
    schema: S,
  ): z.infer<S> => schema.parse(getQuery(e))

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

  /**
   * Finds a user by email without breaking accounts stored before emails were
   * normalized: exact match, then lowercase, then a case-insensitive match that
   * counts only if it is unique. Includes the password hash.
   */
  protected findUserByEmail = async (
    email: string,
  ): Promise<UserDocument | null> => {
    const typed = email.trim()
    const exact = await User.findOne({ email: typed })
    if (exact) return exact
    const lower = await User.findOne({ email: typed.toLowerCase() })
    if (lower) return lower
    const matches = await User.find({ email: typed })
      .collation({ locale: 'en', strength: 2 })
      .limit(2)
    return matches.length === 1 ? matches[0]! : null
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
