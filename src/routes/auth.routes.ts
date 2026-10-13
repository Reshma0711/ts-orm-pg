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

router.post("/register", registerValidation, validate, authController.register);

router.post("/login", loginValidation, validate, authController.login);

router.post("/refresh-token", refreshTokenValidation, validate, authController.refreshToken);

router.post("/forgot-password", forgotPasswordValidation, validate, authController.forgotPassword);

router.post("/reset-password", resetPasswordValidation, validate, authController.resetPassword);

router.get("/profile", authenticate, authController.getProfile);

router.patch("/profile", authenticate, updateProfileValidation, validate, authController.updateProfile);

router.patch("/change-password", authenticate, changePasswordValidation, validate, authController.changePassword);

router.post("/logout", authenticate, authController.logout);

export default router;
