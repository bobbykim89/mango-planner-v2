import { userController } from "@/server/controller";

export default defineEventHandler({
  handler: eventHandler(userController.signupUser),
});
