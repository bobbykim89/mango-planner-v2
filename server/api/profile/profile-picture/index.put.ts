import { profileController } from '../../../controller'

export default defineEventHandler({
  onRequest: [
    defineRequestMiddleware(checkAuth),
    defineRequestMiddleware(uploadCloudinary),
  ],
  handler: eventHandler(profileController.updateProfilePicture),
})
