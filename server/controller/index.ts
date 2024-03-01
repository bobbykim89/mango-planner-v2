import { AuthController } from "./auth/auth.controller";
import { PlanController } from "./plan/plan.controller";
import { UserController } from "./user/user.controller";

export const authController = new AuthController();
export const planController = new PlanController();
export const userController = new UserController();
