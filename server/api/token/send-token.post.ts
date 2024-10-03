import { tokenController } from '@/server/controller'

export default defineEventHandler({
  handler: eventHandler(tokenController.sendToken),
})
