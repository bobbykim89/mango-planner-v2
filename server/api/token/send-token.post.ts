import { tokenController } from '../../controller'

export default defineApiHandler({
  handler: tokenController.sendToken,
})
