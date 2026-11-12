import { userController } from '../../controller'

export default defineApiHandler({
  rateLimit: 'signup',
  handler: userController.signupUser,
})
