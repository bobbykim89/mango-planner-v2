import { profileController } from '../../controller'

export default defineEventHandler({
  onRequest: [defineRequestMiddleware(checkAuth)],
  handler: eventHandler(profileController.getCurrentProfile),
})
