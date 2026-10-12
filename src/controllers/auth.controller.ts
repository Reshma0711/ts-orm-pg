import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { sequelize } from "../config/db.config";
import { UniqueConstraintError } from "sequelize";

import User from "../models/user.model";
import Role, { ROLE_CODES } from "../models/role.model";

import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.util";
import {
  sendFailure,
  sendServerError,
  sendSuccess,
} from "../utils/api-response.util";
// import { sendPasswordResetEmail } from "../services/password-reset-email.service";

const DEVELOPMENT_PASSWORD_RESET_OTP = "123456";

export class AuthController {
/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register an account
 *     description: roleCode 0 creates an admin; roleCode 1 requires assignedTo to be an existing admin ID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, mobile, email, password, roleCode]
 *             properties:
 *               firstName: { type: string, minLength: 2, maxLength: 20, example: Jane }
 *               lastName: { type: string, minLength: 2, maxLength: 20, example: Doe }
 *               mobile: { type: string, pattern: '^[0-9]{10,15}$', example: '1234567890' }
 *               email: { type: string, format: email, example: jane@example.com }
 *               password: { type: string, format: password, example: Password1! }
 *               roleCode: { type: integer, enum: [0, 1] }
 *               assignedTo: { type: integer, minimum: 1, example: 1 }
 *     responses:
 *       '201': { description: Account registered }
 *       '400': { description: Invalid request or assignedTo is not an admin }
 *       '409': { description: Role unavailable or duplicate account data }
 *       '429': { description: Auth rate limit exceeded }
 *       '500': { description: Server error }
 */
// REGISTER
async register(
  req: Request,
  res: Response
) {
  try {
    const {
      firstName,
      lastName,
      mobile,
      email,
      password,
      roleCode,
      assignedTo,
    } = req.body;

    const requestedRoleCode = Number(roleCode);

    const role = await Role.findOne({
      where: { roleCode: requestedRoleCode },
    });

    if (!role) {
      return sendFailure(res, 409, "Requested role is not configured");
    }

    let assigningAdminId: number | null = null;
    if (role.roleCode !== ROLE_CODES.admin) {
      assigningAdminId = Number(assignedTo);
      const assigningAdmin = await User.findByPk(assigningAdminId);
      const assigningAdminRole = assigningAdmin?.roleId
        ? await Role.findByPk(assigningAdmin.roleId)
        : null;

      if (assigningAdminRole?.roleCode !== ROLE_CODES.admin) {
        return sendFailure(
          res,
          400,
          "assignedTo must be the ID of an existing admin"
        );
      }
    }

    // Create username
    const username =
      firstName.toLowerCase() +
      lastName.toLowerCase() +
      Math.floor(Math.random() * 10000);

    // Hash password
    const hashedPassword =
      await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      mobile,
      email,
      username,
      password: hashedPassword,
      roleId: role.id,
      assignedTo: assigningAdminId,
    });

    return sendSuccess(res, "Registration successful", {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        mobile: user.mobile,
        email: user.email,
        username: user.username,
        roleCode: role.roleCode,
        roleName: role.roleName,
      },
    }, 201);

  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return sendFailure(
        res,
        409,
        "Email, mobile, or username already exists"
      );
    }

    console.error(error);

    return sendServerError(res, error);
  }
}

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Log in and start a device session
 *     description: A later login replaces the active session. Six failed attempts lock the account until password reset.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: jane@example.com }
 *               password: { type: string, format: password }
 *     responses:
 *       '200': { description: Login successful; returns accessToken, refreshToken, and user }
 *       '401': { description: Invalid credentials }
 *       '423': { description: Account is locked }
 *       '429': { description: Auth rate limit exceeded }
 *       '500': { description: Server error }
 */
// LOGIN
async login(
  req: Request,
  res: Response
) {
  try {
    const {
      email,
      password,
    } = req.body;

    const result = await sequelize.transaction(async (transaction) => {
      const user = await User.findOne({
        where: { email },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!user) {
        return { status: "invalid" as const };
      }

      if (user.isLocked) {
        return { status: "locked" as const };
      }

      const passwordCorrect = await bcrypt.compare(password, user.password);

      if (!passwordCorrect) {
        user.failedLoginAttempts += 1;
        if (user.failedLoginAttempts > 5) {
          user.isLocked = true;
          user.lockedAt = new Date();
        }
        await user.save({ transaction });

        if (user.isLocked) {
          return { status: "locked" as const };
        }

        return { status: "invalid" as const };
      }

      user.failedLoginAttempts = 0;
      const accessToken = createAccessToken(user.id);
      const refreshToken = createRefreshToken(user.id);
      user.accessToken = accessToken;
      user.refreshToken = refreshToken;
      await user.save({ transaction });

      return { status: "success" as const, user, accessToken, refreshToken };
    });

    if (result.status === "locked") {
      return sendFailure(
        res,
        423,
        "Account is locked. Change your password to regain access."
      );
    }

    if (result.status === "invalid") {
      return sendFailure(res, 401, "Invalid email or password");
    }

    const { user, accessToken, refreshToken } = result;

    return sendSuccess(res, "Login successful", {
      accessToken,
      refreshToken,

      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile: user.mobile,
        username: user.username,
        profilePicture: user.profilePicture,
      },
    });

  } catch (error) {
    console.error(error);

    return sendServerError(res, error);
  }
}

/**
 * @openapi
 * /auth/refresh-token:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh an access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       '200': { description: New access token returned }
 *       '401': { description: Refresh token invalid, expired, or superseded }
 *       '429': { description: Auth rate limit exceeded }
 *       '500': { description: Server error }
 */
// REFRESH TOKEN
async refreshToken(
  req: Request,
  res: Response
) {
  try {
    const {
      refreshToken,
    } = req.body;

    // Verify token
    const decoded =
      verifyRefreshToken(
        refreshToken
      );

    const result = await sequelize.transaction(async (transaction) => {
      const user = await User.findByPk(decoded.userId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (
        !user ||
        user.isLocked ||
        user.refreshToken !== refreshToken
      ) {
        return null;
      }

      const newAccessToken = createAccessToken(user.id);
      user.accessToken = newAccessToken;
      await user.save({ transaction });

      return { user, accessToken: newAccessToken };
    });

    if (!result) {
      return sendFailure(res, 401, "Invalid refresh token");
    }

    return sendSuccess(res, "Access token refreshed successfully", {
      accessToken: result.accessToken,
    });

  } catch (error) {
    if (
      error instanceof Error &&
      ["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(error.name)
    ) {
      return sendFailure(res, 401, "Invalid or expired refresh token");
    }

    console.error("Failed to refresh access token:", error);
    return sendServerError(res, error);
  }
}

/**
 * @openapi
 * /auth/profile:
 *   get:
 *     tags: [Authentication]
 *     summary: Get the authenticated user's profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200': { description: Profile returned }
 *       '401': { description: Missing, invalid, expired, or superseded access token }
 *       '404': { description: User not found }
 *       '500': { description: Server error }
 */
// GET PROFILE
async getProfile(
  req: Request,
  res: Response
) {
  try {
    const userId =
      (req as any).userId;

    const user = await User.findByPk(
      userId
    );

    if (!user) {
      return sendFailure(res, 404, "User not found");
    }

    return sendSuccess(res, "Profile retrieved successfully", {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        mobile: user.mobile,
        email: user.email,
        username: user.username,
        profilePicture: user.profilePicture,
      },
    });

  } catch (error) {
    console.error("Failed to retrieve profile:", error);
    return sendServerError(res, error);
  }
}

/**
 * @openapi
 * /auth/profile:
 *   patch:
 *     tags: [Authentication]
 *     summary: Update the authenticated user's profile
 *     description: Partial update. Role and assignedTo cannot be changed here.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             additionalProperties: false
 *             properties:
 *               firstName: { type: string, minLength: 2, maxLength: 20 }
 *               lastName: { type: string, minLength: 2, maxLength: 20 }
 *               mobile: { type: string, pattern: '^[0-9]{10,15}$' }
 *               email: { type: string, format: email }
 *     responses:
 *       '200': { description: Profile updated }
 *       '400': { description: Invalid request or duplicate value }
 *       '401': { description: Authentication required }
 *       '500': { description: Server error }
 */
//Update User
async updateProfile(
  req: Request,
  res: Response
) {
  try {
    // User ID comes from auth middleware
    const userId = (req as any).userId;

    const {
      firstName,
      lastName,
      mobile,
      email,
    } = req.body;

    // Find logged-in user
    const user = await User.findByPk(userId);

    if (!user) {
      return sendFailure(res, 404, "User not found");
    }

    // Check email if user is changing it
    if (email && email !== user.email) {

      const emailExists =
        await User.findOne({
          where: {
            email,
          },
        });

      if (emailExists) {
        return sendFailure(res, 400, "Email already exists");
      }

      user.email = email;
    }

    // Check mobile if user is changing it
    if (mobile && mobile !== user.mobile) {

      const mobileExists =
        await User.findOne({
          where: {
            mobile,
          },
        });

      if (mobileExists) {
        return sendFailure(res, 400, "Mobile already exists");
      }

      user.mobile = mobile;
    }

    // Update first name
    if (firstName) {
      user.firstName = firstName;
    }

    // Update last name
    if (lastName) {
      user.lastName = lastName;
    }

    // Save changes
    await user.save();

    return sendSuccess(res, "Profile updated successfully", {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        mobile: user.mobile,
        email: user.email,
        username: user.username,
      },
    });

  } catch (error) {

    console.error(error);

    return sendServerError(res, error);
  }
}

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Request a password reset OTP
 *     description: Generic response prevents account enumeration. Development uses a static OTP; reset requests are disabled in production until email delivery is enabled.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email, example: jane@example.com }
 *     responses:
 *       '200': { description: Generic reset request response }
 *       '400': { description: Invalid email }
 *       '429': { description: Auth rate limit exceeded }
 *       '503': { description: Password reset disabled in production }
 *       '500': { description: Server error }
 */
// REQUEST PASSWORD RESET
async forgotPassword(
  req: Request,
  res: Response
) {
  try {
    if (process.env.NODE_ENV === "production") {
      return sendFailure(
        res,
        503,
        "Password reset is unavailable while static OTP mode is enabled."
      );
    }

    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (user) {
      const otpHash = await bcrypt.hash(DEVELOPMENT_PASSWORD_RESET_OTP, 10);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      user.resetOtpHash = otpHash;
      user.resetOtpExpiresAt = expiresAt;
      user.resetOtpAttempts = 0;
      await user.save();

      // await sendPasswordResetEmail(user.email, DEVELOPMENT_PASSWORD_RESET_OTP);
    }

    return sendSuccess(
      res,
      "If an account exists for that email, use the development password reset code.",
      user ? { otp: DEVELOPMENT_PASSWORD_RESET_OTP } : {}
    );
  } catch (error) {
    console.error("Failed to request password reset:", error);
    return sendServerError(res, error);
  }
}

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Reset password using an OTP
 *     description: OTP expires after 10 minutes and is invalidated after five incorrect attempts. Successful reset clears account lockout and revokes the active session.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp, newPassword]
 *             properties:
 *               email: { type: string, format: email }
 *               otp: { type: string, pattern: '^[0-9]{6}$', example: '123456' }
 *               newPassword: { type: string, format: password, minLength: 8, maxLength: 100 }
 *     responses:
 *       '200': { description: Password reset }
 *       '400': { description: Invalid or expired OTP or invalid password }
 *       '429': { description: Auth rate limit exceeded }
 *       '500': { description: Server error }
 */
// RESET PASSWORD
async resetPassword(
  req: Request,
  res: Response
) {
  try {
    const { email, otp, newPassword } = req.body;

    const result = await sequelize.transaction(async (transaction) => {
      const user = await User.findOne({
        where: { email },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!user || !user.resetOtpHash || !user.resetOtpExpiresAt) {
        return { status: "invalid" as const };
      }

      if (user.resetOtpExpiresAt.getTime() <= Date.now()) {
        user.resetOtpHash = null;
        user.resetOtpExpiresAt = null;
        user.resetOtpAttempts = 0;
        await user.save({ transaction });
        return { status: "invalid" as const };
      }

      if (user.resetOtpAttempts >= 5) {
        user.resetOtpHash = null;
        user.resetOtpExpiresAt = null;
        user.resetOtpAttempts = 0;
        await user.save({ transaction });
        return { status: "invalid" as const };
      }

      const otpCorrect = await bcrypt.compare(otp, user.resetOtpHash);
      if (!otpCorrect) {
        user.resetOtpAttempts += 1;
        if (user.resetOtpAttempts >= 5) {
          user.resetOtpHash = null;
          user.resetOtpExpiresAt = null;
          user.resetOtpAttempts = 0;
        }
        await user.save({ transaction });
        return { status: "invalid" as const };
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.failedLoginAttempts = 0;
      user.isLocked = false;
      user.lockedAt = null;
      user.resetOtpHash = null;
      user.resetOtpExpiresAt = null;
      user.resetOtpAttempts = 0;
      user.accessToken = null;
      user.refreshToken = null;
      await user.save({ transaction });

      return { status: "success" as const };
    });

    if (result.status === "invalid") {
      return sendFailure(res, 400, "Invalid or expired password reset code");
    }

    return sendSuccess(res, "Password reset successfully");
  } catch (error) {
    console.error("Failed to reset password:", error);
    return sendServerError(res, error);
  }
}

/**
 * @openapi
 * /auth/change-password:
 *   patch:
 *     tags: [Authentication]
 *     summary: Change password while authenticated
 *     description: Requires the current password; revokes the active session after changing it.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string, format: password }
 *               newPassword: { type: string, format: password, minLength: 8, maxLength: 100 }
 *     responses:
 *       '200': { description: Password changed }
 *       '400': { description: Current password incorrect or new password invalid }
 *       '401': { description: Authentication required }
 *       '500': { description: Server error }
 */
// CHANGE PASSWORD
async changePassword(
  req: Request,
  res: Response
) {
  try {
    const userId = (req as Request & { userId: number }).userId;
    const { currentPassword, newPassword } = req.body;

    const result = await sequelize.transaction(async (transaction) => {
      const user = await User.findByPk(userId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!user) {
        return { status: "not-found" as const };
      }

      const currentPasswordCorrect = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!currentPasswordCorrect) {
        return { status: "invalid-current-password" as const };
      }

      const newPasswordMatchesCurrent = await bcrypt.compare(
        newPassword,
        user.password
      );

      if (newPasswordMatchesCurrent) {
        return { status: "same-password" as const };
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.failedLoginAttempts = 0;
      user.isLocked = false;
      user.lockedAt = null;
      user.accessToken = null;
      user.refreshToken = null;
      await user.save({ transaction });

      return { status: "success" as const };
    });

    if (result.status === "not-found") {
      return sendFailure(res, 404, "User not found");
    }

    if (result.status === "invalid-current-password") {
      return sendFailure(res, 400, "Current password is incorrect");
    }

    if (result.status === "same-password") {
      return sendFailure(res, 400, "New password must differ from current password");
    }

    return sendSuccess(res, "Password changed successfully");
  } catch (error) {
    console.error("Failed to change password:", error);
    return sendServerError(res, error);
  }
}

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Log out of the current device
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200': { description: Session revoked }
 *       '401': { description: Authentication required }
 *       '500': { description: Server error }
 */
// LOGOUT
async logout(
  req: Request,
  res: Response
) {
  try {
    const userId =
      (req as any).userId;

    const user = await User.findByPk(
      userId
    );

    if (!user) {
      return sendFailure(res, 404, "User not found");
    }

    user.accessToken = null;
    user.refreshToken = null;
    await user.save();

    return sendSuccess(res, "Logout successful");

  } catch (error) {
    console.error("Failed to log out:", error);
    return sendServerError(res, error);
  }
}

}