import { NextFunction, Request, Response } from "express";
import multer from "multer";

import { profilePictureUpload, UnsupportedImageTypeError } from "../config/upload.config";
import { sendFailure, sendServerError } from "../utils/api-response.util";

export function uploadProfilePicture(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  profilePictureUpload.single("file")(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof UnsupportedImageTypeError) {
      sendFailure(res, 400, error.message);
      return;
    }

    if (error instanceof multer.MulterError) {
      const statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      const message = error.code === "LIMIT_FILE_SIZE"
        ? "Profile picture must be 5 MB or smaller"
        : `Invalid upload: ${error.message}`;
      sendFailure(res, statusCode, message);
      return;
    }

    console.error("Failed to upload profile picture:", error);
    sendServerError(res, error);
  });
}
