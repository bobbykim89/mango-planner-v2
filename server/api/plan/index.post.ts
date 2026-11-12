import { planController } from '../../controller'

export default defineApiHandler({
  auth: true,
  handler: planController.createNewPlan,
})
