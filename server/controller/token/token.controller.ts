import { useRuntimeConfig } from '#imports'
import { resetPwInputSchema, tokenEmailInputSchema } from '#shared/dto/token'
import { Token, User } from '#shared/models'
import { createHash, randomBytes } from 'node:crypto'
import { getRequestURL, type H3Event } from 'h3'
import { BaseController } from '../base.controller'

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex')

export class TokenController extends BaseController {
  /** Emails a reset link if the account exists; the response never says whether it does. */
  public sendToken = async (e: H3Event) => {
    const { email } = await this.validateBody(e, tokenEmailInputSchema)
    const user = await this.findUserByEmail(email)
    if (!user) return null

    // one live link per user: a new request replaces the old one
    await Token.deleteMany({ userId: user.id })
    const raw = randomBytes(32).toString('hex')
    await new Token({ userId: user.id, token: sha256(raw) }).save()

    const base = import.meta.dev
      ? getRequestURL(e).origin
      : useRuntimeConfig().appUrl
    const link = `${base}/auth/reset-password?user=${user.id}&token=${raw}`
    const message = `Click the link below to reset your password. Please note that this link will only be valid for the next hour.\n${link}`
    await sendEmail(user.email, 'Password Reset Request', message)
    return null
  }

  public resetPasswordWithToken = async (e: H3Event) => {
    const { userId, token, password } = await this.validateBody(
      e,
      resetPwInputSchema,
    )
    // claim the token atomically so two uses of the same link can't both succeed
    const claimed = await Token.findOneAndDelete({
      userId,
      token: sha256(token),
    })
    const user = claimed ? await User.findById(userId) : null
    if (!claimed || !user) throw apiError.RESET_TOKEN_INVALID()

    user.password = await hashPassword(password)
    await user.save()
    return null
  }
}
