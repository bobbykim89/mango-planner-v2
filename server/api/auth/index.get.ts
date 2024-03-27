import { authController } from '@/server/controller'

export default defineEventHandler({
  onRequest: [defineRequestMiddleware(checkAuth)],
  handler: eventHandler(authController.getCurrentUser),
})
