import { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import mongoose from "mongoose";
import { Attachment } from "../models/Attachment";
import { registerOrUpdateClient } from "../services/chatService";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".bin";
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

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

    if (!userId) {
      res.status(400).json({ success: false, error: "userId is required" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, error: "No file uploaded" });
      return;
    }

    const client = await registerOrUpdateClient(
      new mongoose.Types.ObjectId(userId),
      deviceId
    );

    const url = `/uploads/${req.file.filename}`;
    const attachment = await Attachment.create({
      clientId: client._id,
      url,
      mimeType: req.file.mimetype,
      size: req.file.size,
      hash: req.body.hash,
    });

    res.status(201).json({
      success: true,
      data: {
        attachmentId: attachment._id.toString(),
        url,
        mimeType: attachment.mimeType,
        size: attachment.size,
      },
    });
  } catch (error: any) {
    next(error);
  }
};
