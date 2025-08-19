import { userController } from '../../controller'

export default defineEventHandler({
  handler: eventHandler(userController.signupUser),
})
