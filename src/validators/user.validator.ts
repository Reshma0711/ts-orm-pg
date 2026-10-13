import { body, param, query } from "express-validator";
import type { Request } from "express";

import Role, { ROLE_CODES } from "../models/role.model";
import User from "../models/user.model";
import { isProduction } from "../config/env.config";
import {
  verifyRefreshToken,
} from "../utils/jwt.util";
import type { IUpdateProfileRequest } from "../interfaces/request/auth.request";

const asRequest = (request: unknown): Request => request as Request;

const uniqueUserFieldValidation = (
  field: "email" | "mobile",
  message: string
) =>
  body(field).custom(async (value, { req }) => {
    if (typeof value !== "string" || value.length === 0) {
      return true;
    }

    const request = asRequest(req);
    const userId = request.params.id
      ? Number(request.params.id)
      : request.userId;
    const existingUser = await User.findOne({ where: { [field]: value } });

    if (existingUser && existingUser.id !== userId) {
      throw new Error(message);
    }

    return true;
  });

const configuredRoleCodeValidation = () =>
  body("roleCode").custom(async (value, { req }) => {
    if (!Object.values(ROLE_CODES).some((roleCode) => roleCode === Number(value))) {
      return true;
    }

    const role = await Role.findOne({ where: { roleCode: Number(value) } });
    if (!role) {
      throw new Error("Requested role is not configured");
    }
    const request = asRequest(req);
    request.validatedRegistrationRole = role;
    if (role.roleCode === ROLE_CODES.admin) {
      request.validatedAssignedAdminId = null;
    }
    return true;
  });

const assignedAdminValidation = () =>
  body("assignedTo")
    .if((_value, { req }) => Number(req.body.roleCode) !== ROLE_CODES.admin)
    .custom(async (value, { req }) => {
      if (!Number.isInteger(Number(value)) || Number(value) < 1) {
        return true;
      }

      const assignedUser = await User.findByPk(Number(value));
      if (!assignedUser) {
        return markValidationFailure(
          req,
          400,
          "assignedTo must be the ID of an existing admin"
        );
      }
      const assignedRole = assignedUser.roleId
        ? await Role.findByPk(assignedUser.roleId)
        : null;

      if (assignedRole?.roleCode !== ROLE_CODES.admin) {
        throw new Error("assignedTo must be the ID of an existing admin");
      }

      const request = asRequest(req);
      request.validatedAssignedAdmin = assignedUser;
      request.validatedAssignedAdminId = assignedUser.id;
      return true;
    });

const uniqueRoleNameValidation = () =>
  body("roleName").custom(async (value, { req }) => {
    if (typeof value !== "string" || value.length === 0) {
      return true;
    }

    const existingRole = await Role.findOne({ where: { roleName: value } });
    const request = asRequest(req);
    const roleId = request.params?.id ? Number(request.params.id) : undefined;
    if (existingRole && existingRole.id !== roleId) {
      throw new Error("Role already exists");
    }
    return true;
  });

const markValidationFailure = (
  req: unknown,
  status: number,
  message: string
): never => {
  const request = asRequest(req);
  request.validationStatus ??= status;
  throw new Error(message);
};

const userRoleConfiguredValidation = () =>
  body("email").custom(async (_value, { req }) => {
    const role = await Role.findOne({
      where: { roleCode: ROLE_CODES.user },
    });
    if (!role) {
      return markValidationFailure(req, 503, "User role is not configured");
    }

    asRequest(req).validatedUserRole = role;
    return true;
  });

const accessibleUserByIdValidation = (
  notFoundMessage: string,
  forbiddenMessage: string
) => [
  param("id")
    .isInt({ min: 1 })
    .withMessage("User ID must be a positive integer")
    .bail()
    .custom(async (value, { req }) => {
      const request = asRequest(req);
      const requester = request.authenticatedUser;
      if (!requester) {
        return markValidationFailure(req, 401, "Authentication required");
      }

      const userId = Number(value);
      const isAdmin = requester.role?.roleCode === ROLE_CODES.admin;
      if (userId !== requester.id && !isAdmin) {
        return markValidationFailure(
          req,
          403,
          forbiddenMessage
        );
      }

      const targetUser = await User.findOne({
        where: {
          id: userId,
          ...(userId !== requester.id ? { assignedTo: requester.id } : {}),
        },
        attributes: [
          "id",
          "firstName",
          "lastName",
          "mobile",
          "email",
          "username",
          "roleId",
          "assignedTo",
          "profilePicture",
          "createdAt",
        ],
        include: [
          {
            model: Role,
            as: "role",
            attributes: ["roleCode", "roleName"],
          },
          {
            model: User,
            as: "assignedToAdmin",
            attributes: ["id", "firstName", "lastName"],
          },
        ],
      });
      if (!targetUser) {
        return markValidationFailure(req, 404, notFoundMessage);
      }

      request.validatedTargetUser = targetUser;
      return true;
    }),
];

const assignedUserByIdValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("User ID must be a positive integer")
    .bail()
    .custom(async (value, { req }) => {
      const request = asRequest(req);
      const admin = request.authenticatedUser;
      if (!admin) {
        return markValidationFailure(req, 401, "Authentication required");
      }

      const user = await User.findOne({
        where: { id: Number(value), assignedTo: admin.id },
      });
      if (!user) {
        return markValidationFailure(req, 404, "Assigned user not found");
      }

      request.validatedTargetUser = user;
      return true;
    }),
];

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
  uniqueUserFieldValidation(
    "mobile",
    "This mobile number is already registered. Please use a different mobile number."
  ),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  uniqueUserFieldValidation(
    "email",
    "This email is already registered. Please use a different email address."
  ),

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
  configuredRoleCodeValidation(),

  body("assignedTo")
    .if((_value, { req }) => Number(req.body.roleCode) !== ROLE_CODES.admin)
    .exists()
    .withMessage("Assigned admin user ID is required for non-admin roles")
    .bail()
    .isInt({ min: 1 })
    .withMessage("Assigned admin user ID must be a positive integer")
    .bail()
    .toInt(),
  assignedAdminValidation(),
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
    .withMessage("Refresh token is required")
    .bail()
    .custom((value, { req }) => {
      try {
        asRequest(req).validatedRefreshTokenUserId =
          verifyRefreshToken(value).userId;
        return true;
      } catch (error) {
        if (
          error instanceof Error &&
          ["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(
            error.name
          )
        ) {
          return markValidationFailure(
            req,
            401,
            "Invalid or expired refresh token"
          );
        }
        throw error;
      }
    }),
];

export const forgotPasswordValidation = [
  body("email").custom((_value, { req }) => {
    if (isProduction) {
      return markValidationFailure(
        req,
        503,
        "Password reset is unavailable while static OTP mode is enabled."
      );
    }
    return true;
  }),
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
  body().custom((value, { req }) => {
    const { firstName, lastName, mobile, email } = value ?? {};
    if (
      firstName === undefined &&
      lastName === undefined &&
      mobile === undefined &&
      email === undefined
    ) {
      throw new Error("At least one profile field must be provided");
    }
    return true;
  }),
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
  uniqueUserFieldValidation(
    "mobile",
    "This mobile number is already registered. Please use a different mobile number."
  ),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  uniqueUserFieldValidation(
    "email",
    "This email is already registered. Please use a different email address."
  ),
  body().custom((value, { req }) => {
    const updates: IUpdateProfileRequest = {};
    if (value.firstName !== undefined) {
      updates.firstName = value.firstName;
    }
    if (value.lastName !== undefined) {
      updates.lastName = value.lastName;
    }
    if (value.mobile !== undefined) {
      updates.mobile = value.mobile;
    }
    if (value.email !== undefined) {
      updates.email = value.email;
    }
    asRequest(req).validatedProfileUpdates = updates;
    return true;
  }),
];

const roleNameValidation = () =>
  body("roleName")
    .trim()
    .notEmpty()
    .withMessage("Role name is required")
    .bail()
    .isIn(Object.keys(ROLE_CODES))
    .withMessage("Role name must be admin or user");

export const createRoleValidation = [
  roleNameValidation(),
  uniqueRoleNameValidation(),
];

export const roleIdValidation = [
  param("id")
    .isInt({ min: 1 })
    .withMessage("Role ID must be a positive integer")
    .bail()
    .custom(async (value, { req }) => {
      const role = await Role.findByPk(Number(value));
      if (!role) {
        return markValidationFailure(req, 404, "Role not found");
      }
      asRequest(req).validatedRole = role;
      return true;
    }),
];

export const updateRoleValidation = [
  ...roleIdValidation,
  roleNameValidation(),
  uniqueRoleNameValidation(),
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
  userRoleConfiguredValidation(),
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
  uniqueUserFieldValidation(
    "mobile",
    "This mobile number is already registered. Please use a different mobile number."
  ),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),
  uniqueUserFieldValidation(
    "email",
    "This email is already registered. Please use a different email address."
  ),
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

export const accessibleUserValidation = accessibleUserByIdValidation(
  "Assigned user not found",
  "You can only view your own user details"
);

export const assignedUserRecordValidation = assignedUserByIdValidation;
