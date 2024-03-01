import { planController } from "@/server/controller";

export default defineEventHandler({
  onRequest: [defineRequestMiddleware(checkAuth)],
  handler: eventHandler(planController.createNewPlan),
});
