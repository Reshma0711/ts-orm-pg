import { existsSync } from "node:fs";
import path from "node:path";
import type { Express } from "express";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const sourceControllers = path.resolve(process.cwd(), "src/controllers");
const compiledControllers = path.resolve(process.cwd(), "dist/controllers");
const controllerDocs = (existsSync(sourceControllers)
  ? path.join(sourceControllers, "*.ts")
  : path.join(compiledControllers, "*.js")
).replace(/\\/g, "/");

const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Registration API",
      version: "1.0.0",
      description: "API documentation for registration, authentication, users, and roles.",
    },
    servers: [
      {
        url: process.env.API_BASE_URL || "http://localhost:3000/api",
        description: process.env.API_BASE_URL ? "Configured API server" : "Local development server",
      },
      
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ApiSuccess: {
          type: "object",
          properties: {
            status: { type: "string", example: "success" },
            success: { type: "boolean", example: true },
            message: { type: "string" },
            data: { type: "object", additionalProperties: true },
          },
          required: ["status", "success", "message", "data"],
        },
        ApiFailure: {
          type: "object",
          properties: {
            status: { type: "string", example: "failed" },
            success: { type: "boolean", example: false },
            errors: { type: "object", additionalProperties: true },
            message: { type: "string" },
          },
          required: ["status", "success", "errors", "message"],
        },
      },
    },
  },
  apis: [controllerDocs],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);

export function setupSwagger(app: Express): void {
  app.get("/api-docs.json", (_req, res) => {
    res.json(swaggerSpec);
  });
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
   console.log(`Serving Swagger API documentation url: ${process.env.API_BASE_URL}-docs`)
}
