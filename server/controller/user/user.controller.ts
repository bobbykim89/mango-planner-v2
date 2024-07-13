import { useRuntimeConfig } from '#imports'
import { Profile, User } from '@/server/models'
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
import type { NewUsernameInput, PwUpdateInput, UserInput } from './dto'

const config = useRuntimeConfig()

export class UserController {
  public async signupUser(e: H3Event<EventHandlerRequest>) {
    // validate body
    const body = await readValidatedBody(e, (body) => {
      if (!body) {
        throw createError({
          status: 403,
          message: 'Validation error',
          statusMessage: 'Invalid client request',
        })
      }
      const { name, email, password } = body as UserInput
      if (!name || !email || !password) {
        throw createError({
          status: 403,
          message: 'Validation error',
          statusMessage:
            'Validation error: please fill in all of name, email and password.',
        })
      }
      const validator = {
        email: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
        password:
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/,
      }
      const checkEmail = validator.email.test(email)
      const checkPassword = validator.password.test(password)
      if (!checkEmail) {
        throw createError({
          status: 403,
          message: 'Validation error',
          statusMessage: 'Validation error: please add valid email address',
        })
      }
      if (!checkPassword) {
        throw createError({
          status: 403,
          message: 'Validation error',
          statusMessage: 'Validation error: please add valid password',
        })
      }
      return body as UserInput
    })
    const { name, email, password } = body
    let user = await User.findOne({ email })
    if (user) {
      throw createError({
        status: 400,
        message: 'Bad Request',
        statusMessage:
          'Bad Request: following email address is already in use, please use different email address',
      })
    }
    user = new User({
      name,
      email,
      password,
    })
    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(password, salt)
    const saveUserData = await user.save()
    if (!saveUserData) {
      throw createError({
        status: 500,
        message: 'Server error',
        statusMessage: 'Unexpected error occurred, please try again.',
      })
    }
    // create user profile for new users
    const userProfile = new Profile({
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
    const accessToken = jwt.sign(payload, config.jwtSecret, {
      expiresIn: '7d',
    })

    setResponseStatus(e, 200, 'Successfully created new user')
    const status = getResponseStatus(e)
    const text = getResponseStatusText(e)

    return {
      status,
      message: text,
      access_token: `Bearer ${accessToken}`,
    }
  }
  public async updatePassword(e: H3Event<EventHandlerRequest>) {
    const user = await User.findById(e.context.user.id)
    if (!user) {
      throw createError({
        status: 404,
        message: 'Not found',
        statusMessage: 'User not found',
      })
    }
    // validate body
    const body = await readValidatedBody(e, (body) => {
      if (!body) {
        throw createError({
          status: 403,
          message: 'Validation error',
          statusMessage: 'Invalid client request',
        })
      }
      const { newPassword, currentPassword } = body as Partial<PwUpdateInput>
      if (!newPassword || !currentPassword) {
        throw createError({
          status: 403,
          message: 'Validation error',
          statusMessage:
            'Validation error: please fill in all of current password and new password.',
        })
      }
      const validator = {
        password:
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/,
      }
      const checkNewPassword = validator.password.test(newPassword)
      console.log(checkNewPassword)
      if (!checkNewPassword) {
        throw createError({
          status: 403,
          message: 'Validation error',
          statusMessage: 'Validation error: please add valid password',
        })
      }
      return body as Partial<PwUpdateInput>
    })
    const { currentPassword, newPassword } = body
    // check if current password matches
    const isMatch = await bcrypt.compare(currentPassword!, user.password)
    if (!isMatch) {
      throw createError({
        status: 403,
        message: 'Validation error',
        statusMessage: 'Invalid credential: please check your password again',
      })
    }
    const salt = await bcrypt.genSalt(10)
    const hashedNewPassword = await bcrypt.hash(newPassword!, salt)
    const updatedUser = await User.findByIdAndUpdate(
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
  public async updateUserName(e: H3Event<EventHandlerRequest>) {
    const user = await User.findById(e.context.user.id)
    if (!user) {
      throw createError({
        status: 404,
        message: 'Not found',
        statusMessage: 'User not found',
      })
    }
    // validate body
    const body = await readValidatedBody(e, (body) => {
      if (!body) {
        throw createError({
          status: 403,
          message: 'Validation error',
          statusMessage: 'Invalid client request',
        })
      }
      const { username } = body as Partial<NewUsernameInput>
      if (!username) {
        throw createError({
          status: 403,
          message: 'Validation error',
          statusMessage: 'Validation error: please fill in your username.',
        })
      }
      return body as Partial<NewUsernameInput>
    })
    const updatedUser = await User.findByIdAndUpdate(
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
}
