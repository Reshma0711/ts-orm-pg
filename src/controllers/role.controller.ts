import { Request, Response } from "express";
import { UniqueConstraintError } from "sequelize";

import Role, { ROLE_CODES, RoleName } from "../models/role.model";
import {
  sendFailure,
  sendServerError,
  sendSuccess,
} from "../utils/api-response.util";

export class RoleController {
async listRoles(_req: Request, res: Response) {
  try {
    const roles = await Role.findAll({
      order: [["id", "ASC"]],
    });

    return sendSuccess(res, "Roles retrieved successfully", { roles });
  } catch (error) {
    console.error("Failed to list roles:", error);
    return sendServerError(res, error);
  }
}

async getRole(req: Request, res: Response) {
  try {
    const role = await Role.findByPk(Number(req.params.id));

    if (!role) {
      return sendFailure(res, 404, "Role not found");
    }

    return sendSuccess(res, "Role retrieved successfully", { role });
  } catch (error) {
    console.error("Failed to retrieve role:", error);
    return sendServerError(res, error);
  }
}

async createRole(req: Request, res: Response) {
  const roleName = req.body.roleName as RoleName;

  try {
    const role = await Role.create({
      roleName,
      roleCode: ROLE_CODES[roleName],
    });

    return sendSuccess(
      res,
      "Role created successfully",
      { role },
      201
    );
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return sendFailure(res, 409, "Role already exists");
    }

    console.error("Failed to create role:", error);
    return sendServerError(res, error);
  }
}

async updateRole(req: Request, res: Response) {
  const roleName = req.body.roleName as RoleName;

  try {
    const role = await Role.findByPk(Number(req.params.id));

    if (!role) {
      return sendFailure(res, 404, "Role not found");
    }

    role.roleName = roleName;
    role.roleCode = ROLE_CODES[roleName];
    await role.save();

    return sendSuccess(res, "Role updated successfully", { role });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return sendFailure(res, 409, "Role already exists");
    }

    console.error("Failed to update role:", error);
    return sendServerError(res, error);
  }
}

async deleteRole(req: Request, res: Response) {
  try {
    const role = await Role.findByPk(Number(req.params.id));

    if (!role) {
      return sendFailure(res, 404, "Role not found");
    }

    await role.destroy();
    return sendSuccess(res, "Role deleted successfully");
  } catch (error) {
    console.error("Failed to delete role:", error);
    return sendServerError(res, error);
  }
}

}
