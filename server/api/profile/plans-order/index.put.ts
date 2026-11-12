import { profileController } from '../../../controller'

export default defineApiHandler({
  auth: true,
  handler: profileController.updatePlansOrder,
})
