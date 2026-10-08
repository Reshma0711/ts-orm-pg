import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { sequelize } from "../config/db.config";

import User from "../models/user.model";
import Role, { ROLE_CODES } from "../models/role.model";

import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.util";
import {
  cacheAccessToken,
  cacheAuthTokens,
  clearCachedAuthTokens,
  getCachedRefreshToken,
} from "../services/auth-token.service";
import {
  sendFailure,
  sendServerError,
  sendSuccess,
} from "../utils/api-response.util";
// import { sendPasswordResetEmail } from "../services/password-reset-email.service";

const DEVELOPMENT_PASSWORD_RESET_OTP = "123456";

export class AuthController {
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

    // Check email
    const emailExists = await User.findOne({
      where: { email },
    });

    if (emailExists) {
      return sendFailure(res, 400, "Email already exists");
    }

    // Check mobile
    const mobileExists = await User.findOne({
      where: { mobile },
    });

    if (mobileExists) {
      return sendFailure(res, 400, "Mobile already exists");
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
    console.error(error);

    return sendServerError(res, error);
  }
}

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
      await user.save({ transaction });

      return { status: "success" as const, user };
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

    const { user } = result;

    // Create tokens
    const accessToken =
      createAccessToken(user.id);

    const refreshToken =
      createRefreshToken(user.id);

    // await cacheAuthTokens(user.id, accessToken, refreshToken);

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

    const [user, cachedRefreshToken] = await Promise.all([
      User.findByPk(decoded.userId),
      getCachedRefreshToken(decoded.userId),
    ]);

    if (!user || cachedRefreshToken !== refreshToken) {
      return sendFailure(res, 401, "Invalid refresh token");
    }

    // Create new access token
    const newAccessToken =
      createAccessToken(user.id);

    await cacheAccessToken(user.id, newAccessToken);

    return sendSuccess(res, "Access token refreshed successfully", {
      accessToken: newAccessToken,
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

    // await clearCachedAuthTokens(user.id);

    return sendSuccess(res, "Logout successful");

  } catch (error) {
    console.error("Failed to log out:", error);
    return sendServerError(res, error);
  }
}

}