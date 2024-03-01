import { authController } from "@/server/controller";

export default defineEventHandler({
  handler: eventHandler(authController.loginUser),
});
