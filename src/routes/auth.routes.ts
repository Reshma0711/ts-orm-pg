import { Router } from "express";

import { AuthController } from "../controllers/auth.controller";

import { authenticate } from "../middlewares/auth.middleware";
import { authRateLimit } from "../middlewares/auth-rate-limit.middleware";

import {
  validate,
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  updateProfileValidation,
} from "../middlewares/validation.middleware";

const router = Router();
const authController = new AuthController();

router.use(authRateLimit);

// ==========================
// REGISTER
// ==========================

router.post(
  "/register",

  registerValidation,

  validate,

  authController.register.bind(authController),
);

// ==========================
// LOGIN
// ==========================

router.post(
  "/login",

  loginValidation,

  validate,

  authController.login.bind(authController),
);

// ==========================
// REFRESH TOKEN
// ==========================

router.post(
  "/refresh-token",

  refreshTokenValidation,

  validate,

  authController.refreshToken.bind(authController),
);

router.post(
  "/forgot-password",

  forgotPasswordValidation,

  validate,

  authController.forgotPassword.bind(authController),
);

router.post(
  "/reset-password",

  resetPasswordValidation,

  validate,

  authController.resetPassword.bind(authController),
);

// ==========================
// GET PROFILE
// ==========================

router.get(
  "/profile",

  authenticate,

  authController.getProfile.bind(authController),
);

// ==========================
// UPDATE PROFILE
// ==========================

router.patch(
  "/profile",

  authenticate,

  updateProfileValidation,

  validate,

  authController.updateProfile.bind(authController),
);

router.patch(
  "/change-password",

  authenticate,

  changePasswordValidation,

  validate,

  authController.changePassword.bind(authController),
);

// ==========================
// LOGOUT
// ==========================

router.post(
  "/logout",

  authenticate,

  authController.logout.bind(authController),
);

export default router;
