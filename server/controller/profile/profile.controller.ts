import { useRuntimeConfig } from '#imports'
import { User, Profile } from '@/server/models'
import bcrypt from 'bcryptjs'
import type { EventHandlerRequest, H3Event } from 'h3'
import {
  createError,
  getResponseStatus,
  getResponseStatusText,
  readValidatedBody,
  setResponseStatus,
} from 'h3'

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
      throw createError({
        status: 404,
        message: 'Not found',
        statusMessage: 'Profile for Current User not found',
      })
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
    const profileCheck = await Profile.findOne({ user: user.id })
    if (!profileCheck) {
      throw createError({
        status: 401,
        message: 'Unauthorized',
        statusMessage: 'Each user is authorized to have only one profile',
      })
    }
    const newProfile = new Profile({
      user: user.id,
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
}
