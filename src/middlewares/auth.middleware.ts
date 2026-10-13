import {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  verifyAccessToken,
} from "../utils/jwt.util";
import User from "../models/user.model";
import Role from "../models/role.model";
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

    const user = await User.findByPk(decoded.userId, {
      include: [{
        model: Role,
        as: "role",
        attributes: ["id", "roleCode", "roleName"],
      }],
    });

    if (!user || user.isLocked || user.accessToken !== token) {
      return sendFailure(res, 401, "Invalid or expired access token");
    }

    (req as Request & { userId: number }).userId = decoded.userId;
    req.authenticatedUser = user;

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