import {
  pwUpdateInputSchema,
  userInputSchema,
  usernameSchema,
} from '#shared/dto/user'
import { Profile, User } from '#shared/models'
import bcrypt from 'bcryptjs'
import type { H3Event } from 'h3'
import { BaseController } from '../base.controller'

export class UserController extends BaseController {
  public signupUser = async (e: H3Event) => {
    const { name, email, password } = await this.validateBody(
      e,
      userInputSchema,
    )
    const existing = await User.findOne({ email }).collation({
      locale: 'en',
      strength: 2,
    })
    if (existing) throw apiError.EMAIL_IN_USE()

    const user = await new User({
      name,
      email,
      password: await hashPassword(password),
    }).save()
    // every new user starts with a profile
    await new Profile({ user: user.id }).save()

    return { accessToken: `Bearer ${signToken(user.id)}` }
  }

  public updatePassword = async (e: H3Event) => {
    const user = await User.findById(e.context.user.id)
    if (!user) throw apiError.USER_NOT_FOUND()
    const { currentPassword, newPassword } = await this.validateBody(
      e,
      pwUpdateInputSchema,
    )
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      throw apiError.VALIDATION_FAILED(undefined, [
        {
          field: 'currentPassword',
          message: "Your current password isn't right.",
        },
      ])
    }
    user.password = await hashPassword(newPassword)
    await user.save()
    return null
  }

  public updateUserName = async (e: H3Event) => {
    const user = await this.requireUser(e)
    const { username } = await this.validateBody(e, usernameSchema)
    return User.findByIdAndUpdate(
      user.id,
      { name: username },
      { returnDocument: 'after', projection: { password: 0 } },
    )
  }
}
