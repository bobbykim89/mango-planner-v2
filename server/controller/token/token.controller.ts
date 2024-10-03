import { sendEmail } from '@/server/utils/sendEmail.util'
import type { EventHandlerRequest, H3Event } from 'h3'
import {
  createError,
  getResponseStatus,
  getResponseStatusText,
  readValidatedBody,
} from 'h3'
import { Model } from 'mongoose'
import { type TokenModel, type UserModel, Token, User } from '~/server/models'
import { UserController } from '../user/user.controller'
import { resetPwInputSchema, tokenEmailInputSchema } from './dto'

export class TokenController {
  private tokenModel: Model<TokenModel>
  private userModel: Model<UserModel>
  private userController: UserController
  constructor() {
    this.tokenModel = Token
    this.userModel = User
    this.userController = new UserController()
  }
  public sendToken = async (e: H3Event<EventHandlerRequest>) => {
    const { email, url } = await readValidatedBody(
      e,
      tokenEmailInputSchema.parse
    )
    const user = await this.userModel.findOne({ email })
    if (!user) {
      throw createError({
        status: 400,
        message: 'Bad Request',
        statusMessage:
          'Bad Request: user with following email address is not found',
      })
    }
    let token = await this.tokenModel.findOne({ userId: user.id })
    if (!token) {
      const tempPassword = Math.random().toString(36).slice(-8)
      const hashedToken = await this.userController.hashPassword(tempPassword)
      token = await new this.tokenModel({
        userId: user.id,
        token: hashedToken,
      }).save()
    }
    const message: string = `Click the link below to reset your password. Please note that this link will only be valid for the next hour.\n${url}/auth/reset-password?user=${user.id}&token=${token.token}`
    await sendEmail(user.email, 'Password Reset Request', message)

    const status = getResponseStatus(e)
    const text = getResponseStatusText(e)
    return {
      status,
      message: text,
    }
  }
  public resetPasswordWithToken = async (e: H3Event<EventHandlerRequest>) => {
    const { password, token, userId } = await readValidatedBody(
      e,
      resetPwInputSchema.parse
    )
    const user = await this.userModel.findById(userId)
    if (!user) {
      throw createError({
        status: 400,
        message: 'Not Found',
        statusMessage: 'Not Found: User not found.',
      })
    }
    const pwResetToken = await this.tokenModel.findOne({ userId, token })
    if (!pwResetToken) {
      throw createError({
        status: 400,
        message: 'Not Found',
        statusMessage: 'Not Found: Token not found.',
      })
    }
    const hashedPassword = await this.userController.hashPassword(password)
    user.password = hashedPassword
    await user.save()
    await pwResetToken.deleteOne()

    const status = getResponseStatus(e)
    const text = getResponseStatusText(e)
    return {
      status,
      message: text,
    }
  }
}
