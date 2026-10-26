import express from "express";

import { env } from "./config/env.config";
import { sequelize } from "./config/db.config";
import { connectRedis } from "./config/redis.config";
import { uploadsDirectory } from "./config/upload.config";
import { setupSwagger } from "./config/swagger.config";

import {
  initUserAssociations,
  initUserModel,
} from "./models/user.model";
import { initRoleModel } from "./models/role.model";
import {
  initLoginHistoryAssociations,
  initLoginHistoryModel,
} from "./models/login-history.model";
import { initUserAuditLogModel } from "./models/user-audit-log.model";

import routes from "./routes";
import internalAssignmentRoutes from "./routes/internal-assignment.routes";

const app = express();


// Parse JSON
app.use(express.json());

// Serve uploaded profile pictures
app.use("/uploads", express.static(uploadsDirectory));

// Initialize model
initRoleModel(sequelize);
initUserModel(sequelize);
initLoginHistoryModel(sequelize);
initUserAuditLogModel(sequelize);
initUserAssociations();
initLoginHistoryAssociations();


// Routes
app.use("/api", routes);
app.use("/internal/assignments", internalAssignmentRoutes);

// API documentation
setupSwagger(app);


// Start server
async function startServer() {
  try {

    // Connect PostgreSQL
    await sequelize.authenticate();
    console.log("PostgreSQL connected");

    await connectRedis();
   console.log("Redis connected");

    // Start Express
    app.listen(
      env.port,
      () => {
        console.log(
          "Server running on port 3000"
        );
      }
    );

  } catch (error) {

    console.error(
      "Server failed:",
      error
    );

  }
}

startServer();