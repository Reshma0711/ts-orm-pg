import { existsSync } from "node:fs";
import path from "node:path";
import type { Express } from "express";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { env } from "./env.config";

const sourceSwaggerDocs = path.resolve(process.cwd(), "src/swagger");
const compiledSwaggerDocs = path.resolve(process.cwd(), "dist/swagger");
const swaggerDocs = (existsSync(sourceSwaggerDocs)
  ? path.join(sourceSwaggerDocs, "*.ts")
  : path.join(compiledSwaggerDocs, "*.js")
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
        url: env.apiBaseUrl || `http://localhost:${env.port}/api`,
        description: env.apiBaseUrl ? "Configured API server" : "Local development server",
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
  apis: [swaggerDocs],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);

export function setupSwagger(app: Express): void {
  app.get("/api-docs.json", (_req, res) => {
    res.json(swaggerSpec);
  });
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(`Serving Swagger API documentation at ${env.apiBaseUrl}/api-docs`);
}

