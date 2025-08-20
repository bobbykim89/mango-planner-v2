import { authController } from '../../controller'

export default defineEventHandler({
  handler: eventHandler(authController.loginUser),
})
