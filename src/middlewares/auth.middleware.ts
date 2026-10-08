import {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  verifyAccessToken,
} from "../utils/jwt.util";
import User from "../models/user.model";
import { getCachedAccessToken } from "../services/auth-token.service";
import {
  sendFailure,
  sendServerError,
} from "../utils/api-response.util";

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const header =
      req.headers.authorization;

    if (!header) {
      return sendFailure(res, 401, "Access token required");
    }

    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return sendFailure(res, 401, "Invalid authorization header");
    }

    const decoded =
      verifyAccessToken(token);

    // const [user, cachedAccessToken] = await Promise.all([
    //   User.findByPk(decoded.userId),
    //   getCachedAccessToken(decoded.userId),
    // ]);

    // if (!user || cachedAccessToken !== token) {
    //   return sendFailure(res, 401, "Invalid or expired access token");
    // }

    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return sendFailure(res, 401, "Invalid or expired access token");
    }

    (req as Request & { userId: number }).userId = decoded.userId;

    next();

  } catch (error) {
    if (error instanceof Error && error.name !== "JsonWebTokenError" &&
      error.name !== "TokenExpiredError" && error.name !== "NotBeforeError") {
      console.error("Access token authentication failed:", error);
      return sendServerError(res, error);
    }

    return sendFailure(res, 401, "Invalid or expired access token");
  }
}