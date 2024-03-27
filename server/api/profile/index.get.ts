import { profileController } from '@/server/controller'

export default defineEventHandler({
  onRequest: [defineRequestMiddleware(checkAuth)],
  handler: eventHandler(profileController.getCurrentProfile),
})
