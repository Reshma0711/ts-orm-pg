import { Request, Response } from "express";

import Role, { ROLE_CODES } from "../models/role.model";
import User from "../models/user.model";
import {
  sendFailure,
  sendServerError,
  sendSuccess,
} from "../utils/api-response.util";

export class InternalAssignmentController {
  async validateAssignmentTarget(req: Request, res: Response) {
    try {
      const adminId = req.userId;
      if (!adminId) {
        return sendFailure(res, 401, "Authentication required");
      }

      const userId = Number(req.params.userId);
      const user = await User.findOne({
        where: {
          id: userId,
          assignedTo: adminId,
          isLocked: false,
        },
        attributes: ["id", "assignedTo"],
        include: [{
          model: Role,
          as: "role",
          attributes: ["roleCode"],
          where: { roleCode: ROLE_CODES.user },
          required: true,
        }],
      });

      if (!user || user.assignedTo === null) {
        return sendFailure(
          res,
          404,
          "Active user assigned to this admin was not found"
        );
      }

      return sendSuccess(res, "Assignment target validated", {
        adminId,
        user: {
          id: user.id,
          assignedTo: user.assignedTo,
        },
      });
    } catch (error) {
      console.error("Failed to validate task assignment target:", error);
      return sendServerError(res, error);
    }
  }

  async validateTaskStatusAccess(req: Request, res: Response) {
    try {
      const requester = req.authenticatedUser;
      if (!requester || !requester.role) {
        return sendFailure(res, 401, "Authentication required");
      }

      const userId = Number(req.params.userId);
      const user = await User.findOne({
        where: { id: userId },
        attributes: ["id", "assignedTo"],
        include: [{
          model: Role,
          as: "role",
          attributes: ["roleCode"],
          where: { roleCode: ROLE_CODES.user },
          required: true,
        }],
      });

      if (!user || user.assignedTo === null) {
        return sendFailure(res, 404, "Assigned user was not found");
      }

      const isAssignedAdmin =
        requester.role.roleCode === ROLE_CODES.admin &&
        user.assignedTo === requester.id;
      const isAssignedUser =
        requester.role.roleCode === ROLE_CODES.user &&
        requester.id === user.id;

      if (!isAssignedAdmin && !isAssignedUser) {
        return sendFailure(
          res,
          403,
          "Only the assigned user or their admin can update this task"
        );
      }

      return sendSuccess(res, "Task status access validated", {
        adminId: user.assignedTo,
        user: {
          id: user.id,
          assignedTo: user.assignedTo,
        },
      });
    } catch (error) {
      console.error("Failed to validate task status access:", error);
      return sendServerError(res, error);
    }
  }
}
