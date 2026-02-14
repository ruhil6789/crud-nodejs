import { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import mongoose from "mongoose";
import { Attachment } from "../models/Attachment";
import { registerOrUpdateClient } from "../services/chatService";
import { uploadToS3, getPresignedDownloadUrl } from "../services/s3Service";
import { isS3Configured } from "../config/s3";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".bin";
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const memoryStorage = multer.memoryStorage();

const storage = isS3Configured() ? memoryStorage : diskStorage;

const upload = multer({
  storage,
  limits: { fileSize: 16 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /^image\/|^video\/|^audio\/|^application\/pdf/;
    if (allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"));
    }
  },
});

export const uploadMiddleware = upload.single("file");

export const createAttachmentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.body.userId || req.query.userId;
    const deviceId = req.body.deviceId || req.query.deviceId || "http-upload";

    const userIdStr = typeof userId === "string" ? userId.trim() : String(userId || "");
    if (!userIdStr) {
      res.status(400).json({ success: false, error: "userId is required" });
      return;
    }
    if (!/^[a-fA-F0-9]{24}$/.test(userIdStr)) {
      res.status(400).json({
        success: false,
        error: "userId must be a valid 24-character MongoDB ObjectId",
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, error: "No file uploaded" });
      return;
    }

    const client = await registerOrUpdateClient(
      new mongoose.Types.ObjectId(userIdStr),
      deviceId
    );

    let url: string;
    if (isS3Configured() && req.file.buffer) {
      try {
        url = await uploadToS3(
          req.file.buffer,
          req.file.mimetype,
          req.file.originalname
        );
      } catch (err: any) {
        console.error("S3 upload error:", err?.message || err);
        res.status(500).json({
          success: false,
          error: "S3 upload failed",
          details: process.env.NODE_ENV === "development" ? err?.message : undefined,
        });
        return;
      }
    } else if (req.file.filename) {
      url = `/uploads/${req.file.filename}`;
    } else {
      res.status(500).json({ success: false, error: "Upload storage failed" });
      return;
    }

    const attachment = await Attachment.create({
      clientId: client._id,
      url,
      mimeType: req.file.mimetype,
      size: req.file.size,
      hash: req.body.hash,
    });

    // Build full URL for local uploads; for S3, use viewUrl (presigned) since direct URL is private
    const protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol || "http";
    const host = (req.headers["x-forwarded-host"] as string) || req.get("host") || "localhost:3002";
    const baseUrl = `${protocol}://${host}`;
    const fullUrl = url.startsWith("http") ? url : `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
    const viewUrl = `${baseUrl}/api/attachments/${attachment._id}/view`;

    res.status(201).json({
      success: true,
      data: {
        attachmentId: attachment._id.toString(),
        url,
        fullUrl: url.startsWith("http") ? undefined : fullUrl,
        viewUrl, // Use this to open/view file (works for S3 private buckets)
        mimeType: attachment.mimeType,
        size: attachment.size,
      },
    });
  } catch (error: any) {
    next(error);
  }
};

/** Redirect to viewable URL: presigned for S3, direct for local uploads */
export const getViewUrlHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
      res.status(400).json({ success: false, error: "Invalid attachment ID" });
      return;
    }
    const attachment = await Attachment.findById(id);
    if (!attachment) {
      res.status(404).json({ success: false, error: "Attachment not found" });
      return;
    }
    if (attachment.url.startsWith("http") && isS3Configured()) {
      const presignedUrl = await getPresignedDownloadUrl(attachment.url, 3600);
      if (presignedUrl) {
        res.redirect(302, presignedUrl);
        return;
      }
    }
    const protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol || "http";
    const host = (req.headers["x-forwarded-host"] as string) || req.get("host") || "localhost:3002";
    const directUrl = attachment.url.startsWith("/")
      ? `${protocol}://${host}${attachment.url}`
      : attachment.url;
    res.redirect(302, directUrl);
  } catch (error: any) {
    next(error);
  }
};
