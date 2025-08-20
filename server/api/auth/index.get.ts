import { authController } from '../../controller'

export default defineEventHandler({
  onRequest: [defineRequestMiddleware(checkAuth)],
  handler: eventHandler(authController.getCurrentUser),
})
