import { Request, Response, NextFunction } from "express";
import {
  createChat,
  getChatById,
  getChatsForUser,
  addParticipantToChat,
  removeParticipantFromChat,
} from "../services/chatService";
import { getMessagesForChat } from "../services/messageService";
import mongoose from "mongoose";

export const createChatHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { participants, name } = req.body;
    const userId = req.query.userId as string || req.body.userId;

    if (!userId) {
      res.status(400).json({ success: false, error: "userId is required" });
      return;
    }

    const participantIds = (participants || []).map((p: string) => new mongoose.Types.ObjectId(p));
    const chat = await createChat(
      participantIds,
      name || "",
      new mongoose.Types.ObjectId(userId)
    );

    res.status(201).json({
      success: true,
      data: { chatId: chat._id.toString(), chat },
    });
  } catch (error: any) {
    next(error);
  }
};

export const getChatsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      res.status(400).json({ success: false, error: "userId is required" });
      return;
    }

    const chats = await getChatsForUser(new mongoose.Types.ObjectId(userId));

    res.status(200).json({
      success: true,
      data: chats,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getChatByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const chat = await getChatById(new mongoose.Types.ObjectId(id));

    if (!chat) {
      res.status(404).json({ success: false, error: "Chat not found" });
      return;
    }

    res.status(200).json({
      success: true,
      data: chat,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getChatMessagesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const before = req.query.before ? new Date(req.query.before as string) : undefined;

    const messages = await getMessagesForChat(
      new mongoose.Types.ObjectId(id),
      limit,
      before
    );

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error: any) {
    next(error);
  }
};

export const modifyParticipantsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId, operation } = req.body;
    const chatId = new mongoose.Types.ObjectId(id);
    const targetUserId = new mongoose.Types.ObjectId(userId);

    if (operation === "ADD") {
      await addParticipantToChat(chatId, targetUserId);
    } else if (operation === "REMOVE") {
      await removeParticipantFromChat(chatId, targetUserId);
    } else {
      res.status(400).json({ success: false, error: "Invalid operation" });
      return;
    }

    const chat = await getChatById(chatId);

    res.status(200).json({
      success: true,
      data: chat,
    });
  } catch (error: any) {
    next(error);
  }
};
