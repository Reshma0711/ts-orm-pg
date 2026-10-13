import { validationResult } from "express-validator";

import {
  Request,
  Response,
  NextFunction,
} from "express";
import {
  assignedUsersPaginationValidation,
  accessibleUserValidation,
  assignedUserRecordValidation,
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
  accessibleUserValidation,
  assignedUserRecordValidation,
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
    const statusCode = req.validationStatus ?? 400;
    if (statusCode >= 500) {
      console.error("Request validation could not be completed:", error.msg);
    }
    return sendFailure(res, statusCode, "Validation failed", {
      [field]: error.msg,
    });
  }

  next();
}