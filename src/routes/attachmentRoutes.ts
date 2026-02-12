import { Router } from "express";
import {
  uploadMiddleware,
  createAttachmentHandler,
} from "../controllers/attachmentController";

const router = Router();

router.post("/", uploadMiddleware, createAttachmentHandler);

export default router;
