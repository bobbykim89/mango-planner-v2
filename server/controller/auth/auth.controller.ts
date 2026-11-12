import { authInputSchema } from '#shared/dto/auth'
import bcrypt from 'bcryptjs'
import type { H3Event } from 'h3'
import { BaseController } from '../base.controller'

export class AuthController extends BaseController {
  public getCurrentUser = async (e: H3Event) => {
    return this.requireUser(e)
  }

  public loginUser = async (e: H3Event) => {
    const { email, password } = await this.validateBody(e, authInputSchema)
    const user = await this.findUserByEmail(email)
    // same answer for unknown email and wrong password
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw apiError.AUTH_INVALID_CREDENTIALS()
    }
    return { accessToken: `Bearer ${signToken(user.id)}` }
  }
}
