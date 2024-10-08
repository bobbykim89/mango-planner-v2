import { AuthController } from './auth/auth.controller'
import { PlanController } from './plan/plan.controller'
import { UserController } from './user/user.controller'
import { ProfileController } from './profile/profile.controller'
import { TokenController } from './token/token.controller'

export const authController = new AuthController()
export const planController = new PlanController()
export const userController = new UserController()
export const profileController = new ProfileController()
export const tokenController = new TokenController()
