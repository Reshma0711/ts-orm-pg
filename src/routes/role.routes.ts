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

router.get("/", roleController.listRoles);
router.get("/:id", roleIdValidation, validate, roleController.getRole);
router.post("/", createRoleValidation, validate, roleController.createRole);
router.put("/:id", updateRoleValidation, validate, roleController.updateRole);
router.delete("/:id", roleIdValidation, validate, roleController.deleteRole);

export default router;
