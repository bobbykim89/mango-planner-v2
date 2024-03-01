import { useRuntimeConfig } from "#imports";
import { User } from "@/server/models";
import bcrypt from "bcryptjs";
import type { EventHandlerRequest, H3Event } from "h3";
import {
  createError,
  getResponseStatus,
  getResponseStatusText,
  readValidatedBody,
  setResponseStatus,
} from "h3";
import jwt from "jsonwebtoken";
import type { AuthInput } from "./dto";

const config = useRuntimeConfig();

export class AuthController {
  public async getCurrentUser(e: H3Event<EventHandlerRequest>) {
    try {
      const user = await User.findById(e.context.user.id).select("-password");
      return user;
    } catch (error) {
      throw createError({
        status: 404,
        message: "Not found",
        statusMessage: "User not found",
      });
    }
  }
  public async loginUser(e: H3Event<EventHandlerRequest>) {
    // validatebody
    const body = await readValidatedBody(e, (body) => {
      if (!body) {
        throw createError({
          status: 403,
          message: "Validation error",
          statusMessage: "Invalid client request",
        });
      }
      const { email, password } = body as AuthInput;
      if (!email || !password) {
        throw createError({
          status: 403,
          message: "Validation error",
          statusMessage: "Invalid email or password",
        });
      }
      return body as AuthInput;
    });
    const { email, password } = body;
    let user = await User.findOne({ email });

    if (!user) {
      throw createError({
        status: 403,
        message: "Validation error",
        statusMessage:
          "Invalid credential: please check email or password again",
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw createError({
        status: 403,
        message: "Validation error",
        statusMessage:
          "Invalid credential: please check email or password again",
      });
    }
    // create jwt
    const payload = {
      id: user.id,
    };
    const accessToken = jwt.sign(payload, config.jwtSecret, {
      expiresIn: "7d",
    });

    setResponseStatus(e, 200, "Login successful!");
    const status = getResponseStatus(e);
    const text = getResponseStatusText(e);

    return {
      status,
      message: text,
      access_token: `Bearer ${accessToken}`,
    };
  }
}
