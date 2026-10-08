import { mkdirSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import multer from "multer";

export const uploadsDirectory = path.resolve(process.cwd(), "uploads");
export const profilePictureDirectory = path.join(
  uploadsDirectory,
  "profile-pictures"
);

mkdirSync(profilePictureDirectory, { recursive: true });

const imageExtensions: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export class UnsupportedImageTypeError extends Error {}

export const profilePictureUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, profilePictureDirectory);
    },
    filename: (_req, file, callback) => {
      callback(null, `${randomUUID()}${imageExtensions[file.mimetype]}`);
    },
  }),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!imageExtensions[file.mimetype]) {
      callback(new UnsupportedImageTypeError(
        "Profile picture must be JPEG, PNG, or WebP"
      ));
      return;
    }

    callback(null, true);
  },
});
