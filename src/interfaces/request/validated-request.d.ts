import type Role from "../../models/role.model";
import type User from "../../models/user.model";
import type { IUpdateProfileRequest } from "./auth.request";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
      authenticatedUser?: User;
      validatedRegistrationRole?: Role;
      validatedAssignedAdmin?: User;
      validatedAssignedAdminId?: number | null;
      validatedRefreshTokenUserId?: number;
      validatedUserRole?: Role;
      validatedRole?: Role;
      validatedTargetUser?: User;
      validatedProfileUpdates?: IUpdateProfileRequest;
      validationStatus?: number;
    }
  }
}

export {};
