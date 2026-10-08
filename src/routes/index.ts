import { Router } from "express";

import authRoutes from "./auth.routes";
import roleRoutes from "./role.routes";
import userRoutes from "./user.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/roles", roleRoutes);
router.use("/users", userRoutes);

export default router;
