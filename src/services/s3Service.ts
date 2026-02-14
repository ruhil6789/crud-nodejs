import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import path from "path";
import { s3Config, isS3Configured } from "../config/s3";

const getS3Client = (): S3Client => {
  const accessKey = process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY;
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
  return new S3Client({
    region: s3Config.region,
    ...(accessKey &&
      secretKey && {
        credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      }),
  });
};

/** Upload buffer to S3, returns public URL or throws on error */
export async function uploadToS3(
  buffer: Buffer,
  mimeType: string,
  originalName: string
): Promise<string> {
  if (!isS3Configured()) {
    throw new Error("S3 not configured (set S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)");
  }
  const ext = path.extname(originalName) || ".bin";
  const key = `attachments/${crypto.randomUUID()}${ext}`;
  const client = getS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );
  return `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${key}`;
}

/** Generate a presigned URL for temporary download (e.g. 1 hour) */
export async function getPresignedDownloadUrl(
  s3KeyOrFullUrl: string,
  expiresIn = 3600
): Promise<string | null> {
  if (!isS3Configured()) return null;
  let key = s3KeyOrFullUrl;
  const bucketPrefix = `https://${s3Config.bucket}.s3.`;
  if (key.startsWith(bucketPrefix)) {
    const url = new URL(key);
    key = url.pathname.slice(1);
  }
  const client = getS3Client();
  const cmd = new GetObjectCommand({ Bucket: s3Config.bucket, Key: key });
  return getSignedUrl(client, cmd, { expiresIn });
}
