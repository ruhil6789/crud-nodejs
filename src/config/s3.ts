export const s3Config = {
  region: process.env.AWS_REGION || "us-east-1",
  bucket: process.env.S3_BUCKET || "",
};

// AWS SDK picks up AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY from env by default.
// Also supports AWS_ACCESS_KEY (non-standard) via explicit credentials when set.
export const isS3Configured = (): boolean =>
  !!(
    s3Config.bucket &&
    (process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY) &&
    process.env.AWS_SECRET_ACCESS_KEY
  );
