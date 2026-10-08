import { body, param, query } from "express-validator";

import { ROLE_CODES } from "../models/role.model";

export const registerValidation = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .bail()
    .isLength({ min: 2, max: 20 })
    .withMessage("First name must be between 2 and 20 characters")
    .bail()
    .matches(/^[A-Za-z]+$/)
    .withMessage("First name can contain only letters"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .bail()
    .isLength({ min: 2, max: 20 })
    .withMessage("Last name must be between 2 and 20 characters")
    .bail()
    .matches(/^[A-Za-z]+$/)
    .withMessage("Last name can contain only letters"),

  body("mobile")
    .trim()
    .notEmpty()
    .withMessage("Mobile number is required")
    .bail()
    .matches(/^[0-9]{10,15}$/)
    .withMessage("Mobile number must contain 10 to 15 digits"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .bail()
    .isLength({ min: 8, max: 100 })
    .withMessage("Password must be between 8 and 100 characters")
    .bail()
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .bail()
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .bail()
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .bail()
    .matches(/[@$!%*?&]/)
    .withMessage("Password must contain at least one special character"),

  body("roleCode")
    .exists()
    .withMessage("Role code is required")
    .bail()
    .isInt()
    .withMessage("Role code must be an integer")
    .bail()
    .toInt()
    .isIn(Object.values(ROLE_CODES))
    .withMessage("Role code must be 0 (admin) or 1 (user)"),

  body("assignedTo")
    .if((_value, { req }) => Number(req.body.roleCode) !== ROLE_CODES.admin)
    .exists()
    .withMessage("Assigned admin user ID is required for non-admin roles")
    .bail()
    .isInt({ min: 1 })
    .withMessage("Assigned admin user ID must be a positive integer")
    .bail()
    .toInt(),
];

export const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

export const refreshTokenValidation = [
  body("refreshToken")
    .trim()
    .notEmpty()
    .withMessage("Refresh token is required"),
];

export const forgotPasswordValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
];

export const resetPasswordValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("otp")
    .trim()
    .notEmpty()
    .withMessage("Password reset code is required")
    .bail()
    .matches(/^[0-9]{6}$/)
    .withMessage("Password reset code must be 6 digits"),
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .bail()
    .isLength({ min: 8, max: 100 })
    .withMessage("New password must be between 8 and 100 characters")
    .bail()
    .matches(/[A-Z]/)
    .withMessage("New password must contain at least one uppercase letter")
    .bail()
    .matches(/[a-z]/)
    .withMessage("New password must contain at least one lowercase letter")
    .bail()
    .matches(/[0-9]/)
    .withMessage("New password must contain at least one number")
    .bail()
    .matches(/[@$!%*?&]/)
    .withMessage("New password must contain at least one special character"),
];

export const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .bail()
    .isLength({ min: 8, max: 100 })
    .withMessage("New password must be between 8 and 100 characters")
    .bail()
    .matches(/[A-Z]/)
    .withMessage("New password must contain at least one uppercase letter")
    .bail()
    .matches(/[a-z]/)
    .withMessage("New password must contain at least one lowercase letter")
    .bail()
    .matches(/[0-9]/)
    .withMessage("New password must contain at least one number")
    .bail()
    .matches(/[@$!%*?&]/)
    .withMessage("New password must contain at least one special character"),
];

export const updateProfileValidation = [
  body("roleId")
    .not()
    .exists()
    .withMessage("Role cannot be updated through this endpoint"),
  body("roleCode")
    .not()
    .exists()
    .withMessage("Role cannot be updated through this endpoint"),
  body("role")
    .not()
    .exists()
    .withMessage("Role cannot be updated through this endpoint"),
  body("assignedTo")
    .not()
    .exists()
    .withMessage("Assigned admin cannot be updated through this endpoint"),

  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage("First name must be between 2 and 20 characters")
    .bail()
    .matches(/^[A-Za-z]+$/)
    .withMessage("First name can contain only letters"),

  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage("Last name must be between 2 and 20 characters")
    .bail()
    .matches(/^[A-Za-z]+$/)
    .withMessage("Last name can contain only letters"),

  body("mobile")
    .optional()
    .trim()
    .matches(/^[0-9]{10,15}$/)
    .withMessage("Mobile number must contain 10 to 15 digits"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
];

const roleNameValidation = () =>
  body("roleName")
    .trim()
    .notEmpty()
    .withMessage("Role name is required")
    .bail()
    .isIn(Object.keys(ROLE_CODES))
    .withMessage("Role name must be admin or user");

export const createRoleValidation = [roleNameValidation()];

export const updateRoleValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Role ID must be a positive integer"),
  roleNameValidation(),
];

export const roleIdValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Role ID must be a positive integer"),
];

export const userIdValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("User ID must be a positive integer"),
];

export const assignRoleValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("User ID must be a positive integer"),
  body("roleCode")
    .exists()
    .withMessage("Role code is required")
    .bail()
    .isInt()
    .withMessage("Role code must be an integer")
    .bail()
    .toInt()
    .isIn(Object.values(ROLE_CODES))
    .withMessage("Role code must be 0 (admin) or 1 (user)"),
];

export const assignedUsersPaginationValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .bail()
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be an integer between 1 and 100")
    .bail()
    .toInt(),
];

export const createAssignedUserValidation = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .bail()
    .isLength({ min: 2, max: 20 })
    .withMessage("First name must be between 2 and 20 characters")
    .bail()
    .matches(/^[A-Za-z]+$/)
    .withMessage("First name can contain only letters"),
  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .bail()
    .isLength({ min: 2, max: 20 })
    .withMessage("Last name must be between 2 and 20 characters")
    .bail()
    .matches(/^[A-Za-z]+$/)
    .withMessage("Last name can contain only letters"),
  body("mobile")
    .trim()
    .notEmpty()
    .withMessage("Mobile number is required")
    .bail()
    .matches(/^[0-9]{10,15}$/)
    .withMessage("Mobile number must contain 10 to 15 digits"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .bail()
    .isLength({ min: 8, max: 100 })
    .withMessage("Password must be between 8 and 100 characters")
    .bail()
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .bail()
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .bail()
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .bail()
    .matches(/[@$!%*?&]/)
    .withMessage("Password must contain at least one special character"),
];

export const profilePictureUploadUrlValidation = [
  body("fileName")
    .trim()
    .notEmpty()
    .withMessage("File name is required")
    .bail()
    .isLength({ max: 255 })
    .withMessage("File name must be 255 characters or fewer"),
  body("contentType")
    .trim()
    .notEmpty()
    .withMessage("Content type is required")
    .bail()
    .isIn(["image/jpeg", "image/png", "image/webp"])
    .withMessage("Content type must be JPEG, PNG, or WebP"),
];
