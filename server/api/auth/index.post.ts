import { authController } from '../../controller'

export default defineApiHandler({
  handler: authController.loginUser,
})
