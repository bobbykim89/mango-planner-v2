import type { EventHandlerRequest, H3Event } from 'h3'

import { Plan, User, Profile } from '@/server/models'
import {
  createError,
  getResponseStatus,
  getResponseStatusText,
  getRouterParam,
  readValidatedBody,
  setResponseStatus,
} from 'h3'
import { PlanInput } from './dto'

export class PlanController {
  public async getAllPostByUser(e: H3Event<EventHandlerRequest>) {
    const plans = await Plan.find({ author: e.context.user.id }).sort({
      date: -1,
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
  public async createNewPlan(e: H3Event<EventHandlerRequest>) {
    const user = e.context.user
    const body = await readValidatedBody(e, (body) => {
      if (!body) {
        throw createError({
          status: 403,
          message: 'Validation error',
          statusMessage: 'Invalid client request',
        })
      }
      const { title, type } = body as PlanInput
      if (!title || !type) {
        throw createError({
          status: 403,
          message: 'Validation error',
          statusMessage: "Validation error: title and type can't be null.",
        })
      }
      return body as PlanInput
    })
    const currentUser = await User.findById(user.id).select('-password')
    if (!currentUser) {
      throw createError({
        status: 404,
        message: 'Access denied',
        statusMessage: 'Access denied: user not found',
      })
    }
    const { title, content, complete, type } = body
    const newPlan = new Plan({
      title,
      content,
      complete,
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
    const userProfile = await Profile.findOne({ user: currentUser.id })
    if (userProfile) {
      const updatedBody = {
        plansOrder: [saveData.id, ...userProfile.plansOrder],
      }
      await Profile.findByIdAndUpdate(userProfile.id, updatedBody, {
        new: true,
        returnDocument: 'after',
      })
    }
    return saveData
  }
  public async updatePlan(e: H3Event<EventHandlerRequest>) {
    const user = e.context.user
    const planId = getRouterParam(e, 'id')

    // validator
    const body = await readValidatedBody(e, (body) => {
      if (!body) {
        throw createError({
          status: 403,
          message: 'Validation error',
          statusMessage: 'Invalid client request',
        })
      }
      const { title, type } = body as PlanInput
      if (!title || !type) {
        throw createError({
          status: 403,
          message: 'Validation error',
          statusMessage: "Validation error: title and type can't be null.",
        })
      }
      return body as PlanInput
    })

    const plan = await Plan.findById(planId)

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
    const updatedPlan = await Plan.findByIdAndUpdate(planId, body, {
      new: true,
      returnDocument: 'after',
    })
    return updatedPlan
  }
  public async deletePlanById(e: H3Event<EventHandlerRequest>) {
    const user = e.context.user
    const planId = getRouterParam(e, 'id')
    const currentUser = await User.findById(user.id).select('-password')
    if (!currentUser) {
      throw createError({
        status: 404,
        message: 'Access denied',
        statusMessage: 'Access denied: user not found',
      })
    }
    const plan = await Plan.findById(planId)
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
      await Plan.findByIdAndDelete(planId)
    } catch (error) {
      throw createError({
        status: 500,
        message: 'Internal server error',
        statusMessage:
          'Internal server error: unexpected error happened, please try again.',
      })
    }
    const userProfile = await Profile.findOne({ user: currentUser.id })
    if (userProfile) {
      const updatedBody = {
        plansOrder: userProfile.plansOrder.filter((item) => item !== plan.id),
      }
      await Profile.findByIdAndUpdate(userProfile.id, updatedBody, {
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
