import { Router } from "express";
import {
  createChatHandler,
  getChatsHandler,
  getChatByIdHandler,
  getChatMessagesHandler,
  modifyParticipantsHandler,
} from "../controllers/chatController";

const router = Router();

router.post("/", createChatHandler);
router.get("/", getChatsHandler);
router.get("/:id", getChatByIdHandler);
router.get("/:id/messages", getChatMessagesHandler);
router.put("/:id/participants", modifyParticipantsHandler);

export default router;
