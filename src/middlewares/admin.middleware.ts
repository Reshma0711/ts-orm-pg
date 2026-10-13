import { NextFunction, Request, Response } from "express";

import { ROLE_CODES } from "../models/role.model";
import {
  sendFailure,
  sendServerError,
} from "../utils/api-response.util";

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = req.authenticatedUser;
    if (!user) {
      return sendFailure(res, 401, "Authentication required");
    }

    if (user.role?.roleCode !== ROLE_CODES.admin) {
      return sendFailure(res, 403, "Admin access required");
    }

    return next();
  } catch (error) {
    console.error("Admin authorization failed:", error);
    return sendServerError(res, error);
  }
}
