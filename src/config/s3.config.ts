import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env.config";

let s3Client: S3Client | undefined;

export function getS3Client(): S3Client {
  const region = env.s3.region;
  if (!region) {
    throw new Error("AWS_REGION is not configured");
  }

  s3Client ??= new S3Client({ region });
  return s3Client;
}

export function getS3Bucket(): string {
  const bucket = env.s3.bucket;
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET is not configured");
  }

  return bucket;
}
