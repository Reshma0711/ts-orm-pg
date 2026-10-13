import { Request, Response } from "express";

import Role, { ROLE_CODES, RoleName } from "../models/role.model";
import {
  sendServerError,
  sendSuccess,
} from "../utils/api-response.util";
import type {
  ICreateRoleRequest,
  IUpdateRoleRequest,
} from "../interfaces/request/role.request";
import type {
  IDeleteRoleResponseData,
  IRoleResponse,
  IRoleResponseData,
  IRolesResponseData,
} from "../interfaces/response/role.response";

export class RoleController {

async listRoles(_req: Request, res: Response) {
  try {
    const roles = await Role.findAll({
      order: [["id", "ASC"]],
    });

    const responseData: IRolesResponseData = {
      roles: roles.map((role) => ({
        id: role.id,
        roleName: role.roleName,
        roleCode: role.roleCode,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      })),
    };

    return sendSuccess(res, "Roles retrieved successfully", responseData);
  } catch (error) {
    console.error("Failed to list roles:", error);
    return sendServerError(res, error);
  }
}


async getRole(req: Request, res: Response) {
  try {
    const role = req.validatedRole!;

    const roleResponse: IRoleResponse = {
      id: role.id,
      roleName: role.roleName,
      roleCode: role.roleCode,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
    const responseData: IRoleResponseData = { role: roleResponse };

    return sendSuccess(res, "Role retrieved successfully", responseData);
  } catch (error) {
    console.error("Failed to retrieve role:", error);
    return sendServerError(res, error);
  }
}


async createRole(req: Request, res: Response) {
  const { roleName }: ICreateRoleRequest = req.body;

  try {
    const role = await Role.create({
      roleName,
      roleCode: ROLE_CODES[roleName],
    });

    const roleResponse: IRoleResponse = {
      id: role.id,
      roleName: role.roleName,
      roleCode: role.roleCode,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
    const responseData: IRoleResponseData = { role: roleResponse };

    return sendSuccess(res, "Role created successfully", responseData, 201);
  } catch (error) {
    console.error("Failed to create role:", error);
    return sendServerError(res, error);
  }
}


async updateRole(req: Request, res: Response) {
  const { roleName }: IUpdateRoleRequest = req.body;

  try {
    const role = req.validatedRole!;

    role.roleName = roleName;
    role.roleCode = ROLE_CODES[roleName];
    await role.save();

    const roleResponse: IRoleResponse = {
      id: role.id,
      roleName: role.roleName,
      roleCode: role.roleCode,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
    const responseData: IRoleResponseData = { role: roleResponse };

    return sendSuccess(res, "Role updated successfully", responseData);
  } catch (error) {
    console.error("Failed to update role:", error);
    return sendServerError(res, error);
  }
}


async deleteRole(req: Request, res: Response) {
  try {
    const role = req.validatedRole!;

    await role.destroy();
    const responseData: IDeleteRoleResponseData = {};
    return sendSuccess(res, "Role deleted successfully", responseData);
  } catch (error) {
    console.error("Failed to delete role:", error);
    return sendServerError(res, error);
  }
}

}
