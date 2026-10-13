import type { RoleName } from "../../models/role.model";

export interface IRoleResponse {
  id: number;
  roleName: RoleName;
  roleCode: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRolesResponseData {
  roles: IRoleResponse[];
}

export interface IRoleResponseData {
  role: IRoleResponse;
}

export type IDeleteRoleResponseData = Record<string, never>;
