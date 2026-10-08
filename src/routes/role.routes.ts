import { Router } from "express";

import { RoleController } from "../controllers/role.controller";
import {
  createRoleValidation,
  roleIdValidation,
  updateRoleValidation,
  validate,
} from "../middlewares/validation.middleware";

const router = Router();
const roleController = new RoleController();

router.get("/", roleController.listRoles.bind(roleController));
router.get("/:id", roleIdValidation, validate, roleController.getRole.bind(roleController));
router.post("/", createRoleValidation, validate, roleController.createRole.bind(roleController));
router.put("/:id", updateRoleValidation, validate, roleController.updateRole.bind(roleController));
router.delete("/:id", roleIdValidation, validate, roleController.deleteRole.bind(roleController));

export default router;
