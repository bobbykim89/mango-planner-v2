import { planController } from '../../../controller'

export default defineEventHandler({
  onRequest: [defineRequestMiddleware(checkAuth)],
  handler: eventHandler(planController.updatePlan),
})
