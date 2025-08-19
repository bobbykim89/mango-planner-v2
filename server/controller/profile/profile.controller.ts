import { profileInputDarkSchema, profileInputSchema } from '#shared/dto/profile'
import {
  Plan,
  Profile,
  User,
  type PlanModel,
  type ProfileModel,
  type UserModel,
} from '#shared/models'
import type { EventHandlerRequest, H3Event } from 'h3'
import { createError, readValidatedBody } from 'h3'
import { Model } from 'mongoose'
import { deleteCloudinaryImage } from '../../utils/cloudinary.util'

export class ProfileController {
  private planModel: Model<PlanModel>
  private profileModel: Model<ProfileModel>
  private userModel: Model<UserModel>
  constructor() {
    this.planModel = Plan
    this.profileModel = Profile
    this.userModel = User
  }
  public getCurrentProfile = async (e: H3Event<EventHandlerRequest>) => {
    const user = await this.userModel
      .findById(e.context.user.id)
      .select('-password')
    if (!user) {
      throw createError({
        status: 404,
        message: 'Not found',
        statusMessage: 'User not found',
      })
    }
    const profile = await this.profileModel.findOne({ user: user.id })
    if (!profile) return null
    return profile
  }
  public createNewProfile = async (e: H3Event<EventHandlerRequest>) => {
    const user = await this.userModel
      .findById(e.context.user.id)
      .select('-password')
    // check if user exists
    if (!user) {
      throw createError({
        status: 404,
        message: 'Not found',
        statusMessage: 'User not found',
      })
    }
    // throw error if user already have profile
    const profileCheck = await this.profileModel.findOne({ user: user.id })
    if (profileCheck !== null) {
      throw createError({
        status: 401,
        message: 'Unauthorized',
        statusMessage: 'Each user is authorized to have only one profile',
      })
    }
    // push existing plans to plansOrder
    const userPlans = await this.planModel.find({ author: user.id }).sort({
      date: -1,
    })
    const plansOrder: string[] = userPlans.map((item) => item.id)
    const newProfile = new this.profileModel({
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
  public updateProfilePicture = async (e: H3Event<EventHandlerRequest>) => {
    const file = e.context.file
    const user = await this.userModel
      .findById(e.context.user.id)
      .select('-password')
    if (!user) {
      throw createError({
        status: 404,
        message: 'Not found',
        statusMessage: 'User not found',
      })
    }
    const profile = await this.profileModel.findOne({ user: user.id })
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
    const updatedProfile = await this.profileModel.findByIdAndUpdate(
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
  public updatePlansOrder = async (e: H3Event<EventHandlerRequest>) => {
    const user = await this.userModel
      .findById(e.context.user.id)
      .select('-password')
    if (!user) {
      throw createError({
        status: 404,
        message: 'Not found',
        statusMessage: 'User not found',
      })
    }
    const profile = await this.profileModel.findOne({ user: user.id })
    if (profile === null) {
      throw createError({
        status: 404,
        message: 'Not found',
        statusMessage: 'Profile for Current User not found',
      })
    }
    const body = await readValidatedBody(e, profileInputSchema.parse)
    const updatedProfile = await this.profileModel.findByIdAndUpdate(
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
  public updateDarkMode = async (e: H3Event<EventHandlerRequest>) => {
    const user = await this.userModel
      .findById(e.context.user.id)
      .select('-password')
    if (!user) {
      throw createError({
        status: 404,
        message: 'Not found',
        statusMessage: 'User not found',
      })
    }
    const profile = await this.profileModel.findOne({ user: user.id })
    if (profile === null) {
      throw createError({
        status: 404,
        message: 'Not found',
        statusMessage: 'Profile for Current User not found',
      })
    }
    const body = await readValidatedBody(e, profileInputDarkSchema.parse)
    const updatedProfile = await this.profileModel.findByIdAndUpdate(
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
