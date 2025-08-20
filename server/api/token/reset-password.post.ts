import { tokenController } from '../../controller'

export default defineEventHandler({
  handler: eventHandler(tokenController.resetPasswordWithToken),
})
