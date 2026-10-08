import { validationResult } from "express-validator";

import {
  Request,
  Response,
  NextFunction,
} from "express";
import {
  assignedUsersPaginationValidation,
  assignRoleValidation,
  changePasswordValidation,
  createAssignedUserValidation,
  createRoleValidation,
  forgotPasswordValidation,
  loginValidation,
  refreshTokenValidation,
  resetPasswordValidation,
  registerValidation,
  profilePictureUploadUrlValidation,
  roleIdValidation,
  updateProfileValidation,
  updateRoleValidation,
  userIdValidation,
} from "../validators/user.validator";
import { sendFailure } from "../utils/api-response.util";

export {
  assignedUsersPaginationValidation,
  assignRoleValidation,
  changePasswordValidation,
  createAssignedUserValidation,
  createRoleValidation,
  forgotPasswordValidation,
  loginValidation,
  refreshTokenValidation,
  resetPasswordValidation,
  registerValidation,
  profilePictureUploadUrlValidation,
  roleIdValidation,
  updateProfileValidation,
  updateRoleValidation,
  userIdValidation,
};


// ==========================
// VALIDATION RESULT
// ==========================

export function validate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {

    const error = errors.array()[0];

    const field = "path" in error ? error.path : "unknown";
    return sendFailure(res, 400, "Validation failed", {
      [field]: error.msg,
    });
  }

  next();
}