import { Router } from "express";

import { UserController } from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/admin.middleware";
import { uploadProfilePicture } from "../middlewares/profile-picture-upload.middleware";
import {
  assignedUsersPaginationValidation,
  accessibleUserValidation,
  assignedUserRecordValidation,
  createAssignedUserValidation,
  profilePictureUploadUrlValidation,
  updateProfileValidation,
  validate,
} from "../middlewares/validation.middleware";

const router = Router();
const userController = new UserController();

router.get("/assigned", authenticate, requireAdmin, assignedUsersPaginationValidation, validate, userController.listAssignedUsers);

router.get("/audit-logs", authenticate, requireAdmin, assignedUsersPaginationValidation, validate, userController.listUserAuditLogs);

router.get("/login-history", authenticate, assignedUsersPaginationValidation, validate, userController.getUserLoginHistory);

router.get("/:id", authenticate, accessibleUserValidation, validate, userController.getAssignedUserById);

router.post("/", authenticate, requireAdmin, createAssignedUserValidation, validate, userController.createAssignedUser);

router.post("/upload", authenticate, uploadProfilePicture, userController.uploadProfilePicture);

router.post("/upload-url", authenticate, profilePictureUploadUrlValidation, validate, userController.createProfilePictureUploadUrl);

router.patch("/:id", authenticate, requireAdmin, assignedUserRecordValidation, updateProfileValidation, validate, userController.updateAssignedUser);

router.delete("/:id", authenticate, requireAdmin, assignedUserRecordValidation, validate, userController.deleteAssignedUser);



export default router;
