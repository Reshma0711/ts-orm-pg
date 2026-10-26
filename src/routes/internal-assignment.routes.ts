import { Router } from "express";
import { param } from "express-validator";

import { InternalAssignmentController } from "../controllers/internal-assignment.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/admin.middleware";
import { validate } from "../middlewares/validation.middleware";
import { validateUserId } from "../validators/user.validator";

const router = Router();
const assignmentController = new InternalAssignmentController();

router.get("/validate/:userId",authenticate, requireAdmin, validateUserId, validate, assignmentController.validateAssignmentTarget);
router.get("/validate-status-access/:userId",authenticate,validateUserId,validate, assignmentController.validateTaskStatusAccess);

export default router;
