import { useRuntimeConfig } from '#imports'
import {
  Profile,
  User,
  type UserModel,
  type ProfileModel,
} from '@/server/models'
import bcrypt from 'bcryptjs'
import {
  EventHandlerRequest,
  H3Event,
  createError,
  getResponseStatus,
  getResponseStatusText,
  readValidatedBody,
  setResponseStatus,
} from 'h3'
import jwt from 'jsonwebtoken'
import { userInputSchema, usernameSchema, pwUpdateInputSchema } from './dto'
import { type Model } from 'mongoose'
import { RuntimeConfig } from 'nuxt/schema'

// const config = useRuntimeConfig()

export class UserController {
  private config: RuntimeConfig
  private userModel: Model<UserModel>
  private profileModel: Model<ProfileModel>
  constructor() {
    this.config = useRuntimeConfig()
    this.userModel = User
    this.profileModel = Profile
  }
  public signupUser = async (e: H3Event<EventHandlerRequest>) => {
    // validate body
    const { name, email, password } = await readValidatedBody(
      e,
      userInputSchema.parse
    )
    let user = await this.userModel.findOne({ email })
    if (user) {
      throw createError({
        status: 400,
        message: 'Bad Request',
        statusMessage:
          'Bad Request: following email address is already in use, please use different email address',
      })
    }
    user = new this.userModel({
      name,
      email,
      password,
    })
    user.password = await this.hashPassword(password)
    const saveUserData = await user.save()
    if (!saveUserData) {
      throw createError({
        status: 500,
        message: 'Server error',
        statusMessage: 'Unexpected error occurred, please try again.',
      })
    }
    // create user profile for new users
    const userProfile = new this.profileModel({
      user: user.id,
    })
    const saveUserProfile = await userProfile.save()
    if (!saveUserProfile) {
      throw createError({
        status: 500,
        message: 'Server error',
        statusMessage: 'Unexpected error occurred, please try again.',
      })
    }
    const payload = {
      id: user.id,
    }
    // set access token
    const accessToken = this.signToken(payload)

    setResponseStatus(e, 200, 'Successfully created new user')
    const status = getResponseStatus(e)
    const text = getResponseStatusText(e)

    return {
      status,
      message: text,
      access_token: `Bearer ${accessToken}`,
    }
  }
  public updatePassword = async (e: H3Event<EventHandlerRequest>) => {
    const user = await this.userModel.findById(e.context.user.id)
    if (!user) {
      throw createError({
        status: 404,
        message: 'Not found',
        statusMessage: 'User not found',
      })
    }
    // validate body
    const { currentPassword, newPassword } = await readValidatedBody(
      e,
      pwUpdateInputSchema.parse
    )
    // check if current password matches
    const isMatch = await bcrypt.compare(currentPassword!, user.password)
    if (!isMatch) {
      throw createError({
        status: 403,
        message: 'Validation error',
        statusMessage: 'Invalid credential: please check your password again',
      })
    }
    const hashedNewPassword = await this.hashPassword(newPassword)
    const updatedUser = await this.userModel.findByIdAndUpdate(
      user.id,
      { password: hashedNewPassword },
      { new: true, returnDocument: 'after' }
    )
    if (!updatedUser) {
      throw createError({
        status: 500,
        message: 'Server error',
        statusMessage: 'Unexpected error occurred, please try again.',
      })
    }
    setResponseStatus(e, 200, 'Successfully updated user password')
    const status = getResponseStatus(e)
    const text = getResponseStatusText(e)

    return {
      status,
      message: text,
    }
  }
  public updateUserName = async (e: H3Event<EventHandlerRequest>) => {
    const user = await this.userModel.findById(e.context.user.id)
    if (!user) {
      throw createError({
        status: 404,
        message: 'Not found',
        statusMessage: 'User not found',
      })
    }
    // validate body
    const body = await readValidatedBody(e, usernameSchema.parse)
    const updatedUser = await this.userModel.findByIdAndUpdate(
      user.id,
      { name: body.username },
      { new: true, returnDocument: 'after' }
    )
    if (!updatedUser) {
      throw createError({
        status: 500,
        message: 'Server error',
        statusMessage: 'Unexpected error occurred, please try again.',
      })
    }
    return updatedUser
  }
  public hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    return hashedPassword
  }
  public signToken = (payload: { id: string }) => {
    return jwt.sign(payload, this.config.jwtSecret, { expiresIn: '7d' })
  }
}
