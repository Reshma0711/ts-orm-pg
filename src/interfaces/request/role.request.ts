import type { RoleName } from "../../models/role.model";

export interface ICreateRoleRequest {
  roleName: RoleName;
}

export interface IUpdateRoleRequest {
  roleName: RoleName;
}
