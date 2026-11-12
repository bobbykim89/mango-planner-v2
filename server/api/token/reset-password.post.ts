import { tokenController } from '../../controller'

export default defineApiHandler({
  rateLimit: 'resetPassword',
  handler: tokenController.resetPasswordWithToken,
})
