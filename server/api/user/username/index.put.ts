import { userController } from '@/server/controller'

export default defineEventHandler({
  onRequest: [defineRequestMiddleware(checkAuth)],
  handler: eventHandler(userController.updateUserName),
})
