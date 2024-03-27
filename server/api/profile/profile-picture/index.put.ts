import { profileController } from '@/server/controller'

export default defineEventHandler({
  onRequest: [
    defineRequestMiddleware(checkAuth),
    defineRequestMiddleware(uploadCloudinary),
  ],
  handler: eventHandler(profileController.updateProfilePicture),
})
