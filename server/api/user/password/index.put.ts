import { userController } from '../../../controller'

export default defineApiHandler({
  auth: true,
  handler: userController.updatePassword,
})
