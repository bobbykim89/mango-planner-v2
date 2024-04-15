import { Plan, Profile, User } from '@/server/models'
import { deleteCloudinaryImage } from '@/server/utils/cloudinary.util'
import type { EventHandlerRequest, H3Event } from 'h3'
import { createError, readValidatedBody } from 'h3'
import type { ProfileInput } from './dto'

export class ProfileController {
  public async getCurrentProfile(e: H3Event<EventHandlerRequest>) {
    const user = await User.findById(e.context.user.id).select('-password')
    if (!user) {
      throw createError({
        status: 404,
        message: 'Not found',
        statusMessage: 'User not found',
      })
    }
    const profile = await Profile.findOne({ user: user.id })
    if (!profile) {
      return null
    }
    return profile
  }
  public async createNewProfile(e: H3Event<EventHandlerRequest>) {
    const user = await User.findById(e.context.user.id).select('-password')
    // check if user exists
    if (!user) {
      throw createError({
        status: 404,
        message: 'Not found',
        statusMessage: 'User not found',
      })
    }
    // throw error if user already have profile
    const profileCheck = await Profile.findOne({ user: user.id })
    if (profileCheck !== null) {
      throw createError({
        status: 401,
        message: 'Unauthorized',
        statusMessage: 'Each user is authorized to have only one profile',
      })
    }
    // push existing plans to plansOrder
    const userPlans = await Plan.find({ author: user.id }).sort({
      date: -1,
    })
    const plansOrder: string[] = userPlans.map((item) => item.id)
    const newProfile = new Profile({
      user: user.id,
      plansOrder,
    })
    const saveData = await newProfile.save()
    if (!saveData) {
      throw createError({
        status: 500,
        message: 'Server error',
        statusMessage: 'Unexpected error occurred, please try again.',
      })
    }
    return saveData
  }
  public async updateProfilePicture(e: H3Event<EventHandlerRequest>) {
    const file = e.context.file
    const user = await User.findById(e.context.user.id).select('-password')
    if (!user) {
      throw createError({
        status: 404,
        message: 'Not found',
        statusMessage: 'User not found',
      })
    }
    const profile = await Profile.findOne({ user: user.id })
    if (profile === null) {
      throw createError({
        status: 404,
        message: 'Not found',
        statusMessage: 'Profile for Current User not found',
      })
    }
    if (profile.profilePicture !== '') {
      await deleteCloudinaryImage(profile.profilePicture)
    }
    const updatedProfile = await Profile.findByIdAndUpdate(
      profile.id,
      {
        profilePicture: file.imageId,
        updatedAt: new Date(),
      },
      { new: true, returnDocument: 'after' }
    )
    if (!updatedProfile) {
      throw createError({
        status: 500,
        message: 'Server error',
        statusMessage: 'Unexpected error occurred, please try again.',
      })
    }
    return updatedProfile
  }
  public async updatePlansOrder(e: H3Event<EventHandlerRequest>) {
    const user = await User.findById(e.context.user.id).select('-password')
    if (!user) {
      throw createError({
        status: 404,
        message: 'Not found',
        statusMessage: 'User not found',
      })
    }
    const profile = await Profile.findOne({ user: user.id })
    if (profile === null) {
      throw createError({
        status: 404,
        message: 'Not found',
        statusMessage: 'Profile for Current User not found',
      })
    }
    const body = await readValidatedBody(e, (body) => {
      if (!body) {
        throw createError({
          status: 403,
          message: 'Validation error',
          statusMessage: 'Invalid client request',
        })
      }
      const { plansOrder } = body as Partial<ProfileInput>
      if (!plansOrder) {
        throw createError({
          status: 403,
          message: 'Validation error',
          statusMessage:
            'Validation error: request body does not have plansOrder.',
        })
      }
      return body as Partial<ProfileInput>
    })
    const updatedProfile = await Profile.findByIdAndUpdate(
      profile.id,
      { ...body, updatedAt: new Date() },
      {
        new: true,
        returnDocument: 'after',
      }
    )
    if (!updatedProfile) {
      throw createError({
        status: 500,
        message: 'Server error',
        statusMessage: 'Unexpected error occurred, please try again.',
      })
    }
    return updatedProfile
  }
  public async updateDarkMode(e: H3Event<EventHandlerRequest>) {
    const user = await User.findById(e.context.user.id).select('-password')
    if (!user) {
      throw createError({
        status: 404,
        message: 'Not found',
        statusMessage: 'User not found',
      })
    }
    const profile = await Profile.findOne({ user: user.id })
    if (profile === null) {
      throw createError({
        status: 404,
        message: 'Not found',
        statusMessage: 'Profile for Current User not found',
      })
    }
    const body = await readValidatedBody(e, (body) => {
      if (!body) {
        throw createError({
          status: 403,
          message: 'Validation error',
          statusMessage: 'Invalid client request',
        })
      }
      const { dark } = body as Partial<ProfileInput>
      if (typeof dark === 'undefined' || dark === null) {
        throw createError({
          status: 403,
          message: 'Validation error',
          statusMessage:
            'Validation error: request body does not have plansOrder.',
        })
      }
      return body as Partial<ProfileInput>
    })
    const updatedProfile = await Profile.findByIdAndUpdate(
      profile.id,
      { ...body, updatedAt: new Date() },
      {
        new: true,
        returnDocument: 'after',
      }
    )
    if (!updatedProfile) {
      throw createError({
        status: 500,
        message: 'Server error',
        statusMessage: 'Unexpected error occurred, please try again.',
      })
    }
    return updatedProfile
  }
}
