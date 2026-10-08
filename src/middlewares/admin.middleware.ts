import { NextFunction, Request, Response } from "express";

import Role, { ROLE_CODES } from "../models/role.model";
import User from "../models/user.model";
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
    const userId = (req as Request & { userId?: number }).userId;

    if (!userId) {
      return sendFailure(res, 401, "Authentication required");
    }

    const user = await User.findByPk(userId);
    const role = user?.roleId
      ? await Role.findByPk(user.roleId)
      : null;

    if (role?.roleCode !== ROLE_CODES.admin) {
      return sendFailure(res, 403, "Admin access required");
    }

    return next();
  } catch (error) {
    console.error("Admin authorization failed:", error);
    return sendServerError(res, error);
  }
}
