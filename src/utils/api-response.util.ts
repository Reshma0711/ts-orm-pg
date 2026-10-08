import { Response } from "express";

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

export function sendServerError(res: Response, error: unknown) {
  const errors =
    process.env.NODE_ENV === "production"
      ? { code: "INTERNAL_SERVER_ERROR" }
      : {
          details:
            error instanceof Error ? error.message : String(error),
        };

  return sendFailure(res, 500, "something went wrong", errors);
}
