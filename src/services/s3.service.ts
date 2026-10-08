import { PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { extname } from "path";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getS3Bucket, getS3Client } from "../config/s3.config";

export async function createS3UploadUrl(
  userId: number,
  fileName: string,
  contentType: string
): Promise<{ uploadUrl: string; key: string }> {
  const extension = extname(fileName).toLowerCase();
  const key = `users/${userId}/profile-pictures/${randomUUID()}${extension}`;
  const command = new PutObjectCommand({
    Bucket: getS3Bucket(),
    Key: key,
    ContentType: contentType,
  });
  const uploadUrl = await getSignedUrl(getS3Client(), command, {
    expiresIn: 300,
  });

  return { uploadUrl, key };
}
