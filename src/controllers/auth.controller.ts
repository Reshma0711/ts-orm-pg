import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { randomUUID } from "node:crypto";
import { sequelize } from "../config/db.config";

import User from "../models/user.model";
import LoginHistory from "../models/login-history.model";

import {
  createAccessToken,
  createRefreshToken,
} from "../utils/jwt.util";
import {
  sendFailure,
  sendServerError,
  sendSuccess,
} from "../utils/api-response.util";
import type {
  IChangePasswordRequest,
  IForgotPasswordRequest,
  ILoginRequest,
  IRefreshTokenRequest,
  IRegisterRequest,
  IResetPasswordRequest,
} from "../interfaces/request/auth.request";
import type {
  IForgotPasswordResponseData,
  ILoginResponseData,
  IProfileResponseData,
  IRefreshTokenResponseData,
  IRegisterResponseData,
  IUpdatedProfileResponseData,
  IEmptyResponseData,
} from "../interfaces/response/auth.response";
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
    }: IRegisterRequest = req.body;

    const role = req.validatedRegistrationRole!;
    const assigningAdminId = req.validatedAssignedAdminId!;

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

    const responseData: IRegisterResponseData = {
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
    };

    return sendSuccess(res, "Registration successful", responseData, 201);

  } catch (error) {
    console.error("Failed to register user:", error);
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
    }: ILoginRequest = req.body;

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
        const accountLocked = user.failedLoginAttempts > 5;
        if (accountLocked) {
          user.isLocked = true;
          user.lockedAt = new Date();
        }
        await user.save({ transaction });

        if (accountLocked) {
          return { status: "locked" as const };
        }

        return { status: "invalid" as const };
      }

      user.failedLoginAttempts = 0;
      const accessToken = createAccessToken(user.id);
      const refreshToken = createRefreshToken(user.id);
      const deviceId = randomUUID();
      const loggedInAt = new Date();
      user.accessToken = accessToken;
      user.refreshToken = refreshToken;
      await user.save({ transaction });

      const previousSessions = await LoginHistory.findAll({
        where: { userId: user.id, loggedOutAt: null },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      for (const session of previousSessions) {
        session.loggedOutAt = loggedInAt;
        await session.save({ transaction });
      }

      const userAgent = req.get("user-agent") ?? "";
      const deviceType = /ipad|tablet/i.test(userAgent)
        ? "tablet"
        : /mobile|android|iphone/i.test(userAgent)
          ? "mobile"
          : userAgent
            ? "desktop"
            : "unknown";

      await LoginHistory.create(
        {
          userId: user.id,
          ipAddress: req.ip || req.socket.remoteAddress || "unknown",
          deviceType,
          deviceId,
        },
        { transaction }
      );

      return {
        status: "success" as const,
        user,
        accessToken,
        refreshToken,
        deviceId,
      };
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

    const { user, accessToken, refreshToken, deviceId } = result;
    const responseData: ILoginResponseData = {
      accessToken,
      refreshToken,
      deviceId,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile: user.mobile,
        username: user.username,
        profilePicture: user.profilePicture,
      },
    };

    return sendSuccess(res, "Login successful", responseData);

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
    }: IRefreshTokenRequest = req.body;

    const refreshTokenUserId = req.validatedRefreshTokenUserId!;

    const result = await sequelize.transaction(async (transaction) => {
      const user = await User.findByPk(refreshTokenUserId, {
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

    const responseData: IRefreshTokenResponseData = {
      accessToken: result.accessToken,
    };

    return sendSuccess(res, "Access token refreshed successfully", responseData);

  } catch (error) {
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
    const user = req.authenticatedUser!;

    const responseData: IProfileResponseData = {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        mobile: user.mobile,
        email: user.email,
        username: user.username,
        profilePicture: user.profilePicture,
      },
    };

    return sendSuccess(res, "Profile retrieved successfully", responseData);

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
    const user = req.authenticatedUser!;
    Object.assign(user, req.validatedProfileUpdates!);
    await user.save();

    const responseData: IUpdatedProfileResponseData = {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        mobile: user.mobile,
        email: user.email,
        username: user.username,
      },
    };

    return sendSuccess(res, "Profile updated successfully", responseData);

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
    const { email }: IForgotPasswordRequest = req.body;
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

    const responseData: IForgotPasswordResponseData = user
      ? { otp: DEVELOPMENT_PASSWORD_RESET_OTP }
      : {};

    return sendSuccess(
      res,
      "If an account exists for that email, use the development password reset code.",
      responseData
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
    const { email, otp, newPassword }: IResetPasswordRequest = req.body;

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
      await LoginHistory.update(
        { loggedOutAt: new Date() },
        {
          where: { userId: user.id, loggedOutAt: null },
          transaction,
        }
      );

      return { status: "success" as const };
    });

    if (result.status === "invalid") {
      return sendFailure(res, 400, "Invalid or expired password reset code");
    }

    const responseData: IEmptyResponseData = {};
    return sendSuccess(res, "Password reset successfully", responseData);
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
    const { currentPassword, newPassword }: IChangePasswordRequest = req.body;

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
      await LoginHistory.update(
        { loggedOutAt: new Date() },
        {
          where: { userId: user.id, loggedOutAt: null },
          transaction,
        }
      );

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

    const responseData: IEmptyResponseData = {};
    return sendSuccess(res, "Password changed successfully", responseData);
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
    const userId = (req as Request & { userId: number }).userId;

    const logoutResult = await sequelize.transaction(async (transaction) => {
      const sessionUser = await User.findByPk(userId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!sessionUser) {
        return "not-found" as const;
      }

      const authorization = req.headers.authorization;
      const [scheme, accessToken] = authorization?.split(" ") ?? [];
      if (
        scheme !== "Bearer" ||
        !accessToken ||
        sessionUser.accessToken !== accessToken
      ) {
        return "superseded" as const;
      }

      sessionUser.accessToken = null;
      sessionUser.refreshToken = null;
      await sessionUser.save({ transaction });

      const activeLogin = await LoginHistory.findOne({
        where: { userId: sessionUser.id, loggedOutAt: null },
        order: [["createdAt", "DESC"]],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (activeLogin) {
        activeLogin.loggedOutAt = new Date();
        await activeLogin.save({ transaction });
      }

      return "success" as const;
    });

    if (logoutResult === "not-found") {
      return sendFailure(res, 404, "User not found");
    }

    if (logoutResult === "superseded") {
      return sendFailure(res, 401, "This session has been replaced by another login");
    }

    const responseData: IEmptyResponseData = {};
    return sendSuccess(res, "Logout successful", responseData);

  } catch (error) {
    console.error("Failed to log out:", error);
    return sendServerError(res, error);
  }
}

}