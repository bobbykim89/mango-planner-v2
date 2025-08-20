import { planInputCompleteSchema, planInputSchema } from '#shared/dto/plan'
import {
  Plan,
  Profile,
  User,
  type PlanModel,
  type ProfileModel,
  type UserModel,
} from '#shared/models'
import type { EventHandlerRequest, H3Event } from 'h3'
import {
  createError,
  getResponseStatus,
  getResponseStatusText,
  getRouterParam,
  readValidatedBody,
  setResponseStatus,
} from 'h3'
import { Model } from 'mongoose'

export class PlanController {
  private planModel: Model<PlanModel>
  private profileModel: Model<ProfileModel>
  private userModel: Model<UserModel>
  constructor() {
    this.planModel = Plan
    this.profileModel = Profile
    this.userModel = User
  }
  public getAllPostByUser = async (e: H3Event<EventHandlerRequest>) => {
    const plans = await this.planModel
      .find({ author: e.context.user.id })
      .sort({
        updatedAt: -1,
      })
    if (!plans) {
      throw createError({
        status: 404,
        message: 'Not found',
        statusMessage: 'Plans not found',
      })
    }
    return plans
  }
  public createNewPlan = async (e: H3Event<EventHandlerRequest>) => {
    const user = e.context.user
    const { title, content, type } = await readValidatedBody(
      e,
      planInputSchema.parse
    )
    const currentUser = await User.findById(user.id).select('-password')
    if (!currentUser) {
      throw createError({
        status: 404,
        message: 'Access denied',
        statusMessage: 'Access denied: user not found',
      })
    }
    const newPlan = new this.planModel({
      title,
      content,
      type,
      author: currentUser.id,
    })
    const saveData = await newPlan.save()
    if (!saveData) {
      throw createError({
        status: 500,
        message: 'Server error',
        statusMessage: 'Unexpected error occurred, please try again.',
      })
    }
    const userProfile = await this.profileModel.findOne({
      user: currentUser.id,
    })
    if (userProfile) {
      const updatedBody = {
        plansOrder: [saveData.id, ...userProfile.plansOrder],
      }
      await this.profileModel.findByIdAndUpdate(userProfile.id, updatedBody, {
        new: true,
        returnDocument: 'after',
      })
    }
    return saveData
  }
  public updatePlan = async (e: H3Event<EventHandlerRequest>) => {
    const user = e.context.user
    const planId = getRouterParam(e, 'id')

    // validator
    const body = await readValidatedBody(e, planInputSchema.parse)

    const plan = await this.planModel.findById(planId)

    if (!plan) {
      throw createError({
        status: 404,
        message: 'Not found',
        statusMessage: 'Plan not found',
      })
    }
    if (plan.author?.toString() !== user.id) {
      throw createError({
        status: 401,
        message: 'Access denied',
        statusMessage:
          'Access denied: Current user is not authorized to update this item',
      })
    }
    const updatedPlan = await this.planModel.findByIdAndUpdate(
      planId,
      { ...body, updatedAt: new Date() },
      {
        new: true,
        returnDocument: 'after',
      }
    )
    return updatedPlan
  }
  public togglePlanCompleteById = async (e: H3Event<EventHandlerRequest>) => {
    const user = e.context.user
    const planId = getRouterParam(e, 'id')
    // validator
    const body = await readValidatedBody(e, planInputCompleteSchema.parse)
    const plan = await this.planModel.findById(planId)

    if (!plan) {
      throw createError({
        status: 404,
        message: 'Not found',
        statusMessage: 'Plan not found',
      })
    }
    if (plan.author?.toString() !== user.id) {
      throw createError({
        status: 401,
        message: 'Access denied',
        statusMessage:
          'Access denied: Current user is not authorized to update this item',
      })
    }
    const updatedPlan = await this.planModel.findByIdAndUpdate(
      planId,
      { ...body, updatedAt: new Date() },
      {
        new: true,
        returnDocument: 'after',
      }
    )
    return updatedPlan
  }
  public deletePlanById = async (e: H3Event<EventHandlerRequest>) => {
    const user = e.context.user
    const planId = getRouterParam(e, 'id')
    const currentUser = await this.userModel
      .findById(user.id)
      .select('-password')
    if (!currentUser) {
      throw createError({
        status: 404,
        message: 'Access denied',
        statusMessage: 'Access denied: user not found',
      })
    }
    const plan = await this.planModel.findById(planId)
    // check if item exists in db
    if (!plan) {
      throw createError({
        status: 404,
        message: 'Not found',
        statusMessage: 'Not found: item with following ID not found',
      })
    }
    // validate user
    if (plan.author?.toString() !== currentUser.id) {
      throw createError({
        status: 401,
        message: 'Unauthorized',
        statusMessage:
          'Unauthorized: current user is not authorized for this action.',
      })
    }
    // delete item
    try {
      await this.planModel.findByIdAndDelete(planId)
    } catch (error) {
      throw createError({
        status: 500,
        message: 'Internal server error',
        statusMessage:
          'Internal server error: unexpected error happened, please try again.',
      })
    }
    const userProfile = await this.profileModel.findOne({
      user: currentUser.id,
    })
    if (userProfile) {
      const updatedBody = {
        plansOrder: userProfile.plansOrder.filter((item) => item !== plan.id),
      }
      await this.profileModel.findByIdAndUpdate(userProfile.id, updatedBody, {
        new: true,
        returnDocument: 'after',
      })
    }
    // send completion message
    setResponseStatus(e, 200, 'Successfuly deleted item.')
    const status = getResponseStatus(e)
    const statusText = getResponseStatusText(e)
    return {
      status,
      text: statusText,
    }
  }
}
