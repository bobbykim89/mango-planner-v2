import { authController } from '../../controller'

export default defineApiHandler({
  auth: true,
  handler: authController.getCurrentUser,
})
