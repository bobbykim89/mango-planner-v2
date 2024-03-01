import { authController } from "@/server/controller";
import { checkAuth } from "@/server/utils/checkAuth.util";

export default defineEventHandler({
  onRequest: [defineRequestMiddleware(checkAuth)],
  handler: eventHandler(authController.getCurrentUser),
});
