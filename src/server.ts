import express from "express";

import { sequelize } from "./config/db.config";
import { connectRedis } from "./config/redis.config";
import { uploadsDirectory } from "./config/upload.config";

import {
  initUserAssociations,
  initUserModel,
} from "./models/user.model";
import { initRoleModel } from "./models/role.model";

import routes from "./routes";

const app = express();


// Parse JSON
app.use(express.json());

// Serve uploaded profile pictures
app.use("/uploads", express.static(uploadsDirectory));

// Initialize model
initRoleModel(sequelize);
initUserModel(sequelize);
initUserAssociations();


// Routes
app.use("/api", routes);


// Start server
async function startServer() {
  try {

    // Connect PostgreSQL
    await sequelize.authenticate();
    console.log("PostgreSQL connected");

    // await connectRedis();
    // console.log("Redis connected");

    // Start Express
    app.listen(
      3000,
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