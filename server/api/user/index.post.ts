import { userController } from '../../controller'

export default defineApiHandler({
  handler: userController.signupUser,
})
