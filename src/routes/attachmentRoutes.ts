import { Router } from "express";
import {
  uploadMiddleware,
  createAttachmentHandler,
  getViewUrlHandler,
} from "../controllers/attachmentController";

const router = Router();

router.post("/", uploadMiddleware, createAttachmentHandler);
router.get("/:id/view", getViewUrlHandler);

export default router;
