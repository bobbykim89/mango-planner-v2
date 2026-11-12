import { tokenController } from '../../controller'

export default defineApiHandler({
  rateLimit: ['sendTokenIp', 'sendTokenEmail'],
  handler: tokenController.sendToken,
})
