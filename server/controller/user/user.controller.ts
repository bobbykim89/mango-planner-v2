import { useRuntimeConfig } from "#imports";
import { User } from "@/server/models";
import bcrypt from "bcryptjs";
import {
  EventHandlerRequest,
  H3Event,
  createError,
  getResponseStatus,
  getResponseStatusText,
  readValidatedBody,
  setResponseStatus,
} from "h3";
import jwt from "jsonwebtoken";
import type { UserInput } from "./dto";

const config = useRuntimeConfig();

export class UserController {
  public async signupUser(e: H3Event<EventHandlerRequest>) {
    // validate body
    const body = await readValidatedBody(e, (body) => {
      if (!body) {
        throw createError({
          status: 403,
          message: "Validation error",
          statusMessage: "Invalid client request",
        });
      }
      const { name, email, password } = body as UserInput;
      if (!name || !email || !password) {
        throw createError({
          status: 403,
          message: "Validation error",
          statusMessage:
            "Validation error: please fill in all of name, email and password.",
        });
      }
      const validator = {
        email: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
        password: /^(.{0,7}|[^0-9]*|[^A-Z]*|[^a-z]*|[a-zA-Z0-9]*)$/,
      };
      const checkEmail = validator.email.test(email);
      const checkPassword = validator.password.test(password);
      if (!checkEmail) {
        throw createError({
          status: 403,
          message: "Validation error",
          statusMessage: "Validation error: please add valid email address",
        });
      }
      if (checkPassword) {
        throw createError({
          status: 403,
          message: "Validation error",
          statusMessage: "Validation error: please add valid password",
        });
      }
      return body as UserInput;
    });
    const { name, email, password } = body;
    let user = await User.findOne({ email });
    if (user) {
      throw createError({
        status: 400,
        message: "Bad Request",
        statusMessage:
          "Bad Request: following email address is already in use, please use different email address",
      });
    }
    user = new User({
      name,
      email,
      password,
    });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    const payload = {
      id: user.id,
    };
    // set access token
    const accessToken = jwt.sign(payload, config.jwtSecret, {
      expiresIn: "7d",
    });
    setResponseStatus(e, 200, "Successfully created new user");
    const status = getResponseStatus(e);
    const text = getResponseStatusText(e);

    return {
      status,
      message: text,
      access_token: `Bearer ${accessToken}`,
    };
  }
}
