import { Router } from "express";

import { UserController } from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/admin.middleware";
import { uploadProfilePicture } from "../middlewares/profile-picture-upload.middleware";
import {
  assignedUsersPaginationValidation,
  assignRoleValidation,
  createAssignedUserValidation,
  profilePictureUploadUrlValidation,
  updateProfileValidation,
  userIdValidation,
  validate,
} from "../middlewares/validation.middleware";

const router = Router();
const userController = new UserController();

router.get(
  "/assigned",
  authenticate,
  requireAdmin,
  assignedUsersPaginationValidation,
  validate,
  userController.listAssignedUsers.bind(userController)
);

router.get(
  "/:id",
  authenticate,
  // requireAdmin,
  userIdValidation,
  validate,
  userController.getAssignedUserById.bind(userController)
);

router.post(
  "/",
  authenticate,
  requireAdmin,
  createAssignedUserValidation,
  validate,
  userController.createAssignedUser.bind(userController)
);

router.post(
  "/upload",
  authenticate,
  uploadProfilePicture,
  userController.uploadProfilePicture.bind(userController)
);

router.post(
  "/upload-url",
  authenticate,
  profilePictureUploadUrlValidation,
  validate,
  userController.createProfilePictureUploadUrl.bind(userController)
);

router.patch(
  "/:id",
  authenticate,
  requireAdmin,
  userIdValidation,
  updateProfileValidation,
  validate,
  userController.updateAssignedUser.bind(userController)
);

router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  userIdValidation,
  validate,
  userController.deleteAssignedUser.bind(userController)
);


export default router;
