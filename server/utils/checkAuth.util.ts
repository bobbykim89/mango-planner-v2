import { useRuntimeConfig } from "#imports";
import type { EventHandlerRequest, H3Event } from "h3";
import { getRequestHeader } from "h3";
import jwt from "jsonwebtoken";

export const checkAuth = (event: H3Event<EventHandlerRequest>) => {
  const config = useRuntimeConfig();
  const bearerToken = getRequestHeader(event, "Authorization");

  // check if token exists
  if (!bearerToken) {
    throw createError({
      status: 400,
      message: "Unauthorized",
      statusMessage: "No access token found, authorization denied..",
    });
  }
  const token = bearerToken?.replace("Bearer ", "");
  try {
    const decodedToken = jwt.verify(token!, config.jwtSecret);
    event.context.user = decodedToken;
  } catch (error) {
    // throw error for not valid token
    throw createError({
      status: 401,
      message: "Unauthorized",
      statusMessage: "Access token is not valid",
    });
  }
};
