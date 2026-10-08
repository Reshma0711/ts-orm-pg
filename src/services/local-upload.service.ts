import { unlink } from "fs/promises";
import path from "path";

import { profilePictureDirectory } from "../config/upload.config";

export function getLocalProfilePictureUrl(fileName: string): string {
  return `/uploads/profile-pictures/${fileName}`;
}

export async function removeLocalProfilePicture(fileName: string): Promise<void> {
  if (path.basename(fileName) !== fileName) {
    throw new Error("Invalid profile picture file name");
  }
  await unlink(path.join(profilePictureDirectory, fileName));
}
