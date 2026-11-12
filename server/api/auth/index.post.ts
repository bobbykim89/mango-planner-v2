import { authController } from '../../controller'

export default defineApiHandler({
  rateLimit: 'login',
  handler: authController.loginUser,
})
