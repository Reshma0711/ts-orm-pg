import { Response } from "express";
import { UniqueConstraintError } from "sequelize";
import { isProduction } from "../config/env.config";

export type ApiErrors = Record<string, unknown>;

export function sendSuccess(
  res: Response,
  message: string,
  data: unknown = {},
  httpStatus = 200
) {
  return res.status(httpStatus).json({
    status: "success",
    success: true,
    message,
    data,
  });
}

export function sendFailure(
  res: Response,
  httpStatus: number,
  message: string,
  errors: ApiErrors = {}
) {
  return res.status(httpStatus).json({
    status: "failed",
    success: false,
    errors,
    message,
  });
}

export function sendServerError(
  res: Response,
  error: unknown
) {
  if (error instanceof UniqueConstraintError) {
    return sendFailure(
      res,
      409,
      "A record with the provided unique values already exists"
    );
  }

  const errors =
    isProduction
      ? { code: "INTERNAL_SERVER_ERROR" }
      : {
          details:
            error instanceof Error ? error.message : String(error),
        };

  return sendFailure(res, 500, "something went wrong", errors);
}
