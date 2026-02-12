import { Message } from "../models/Message";
import { Inbox } from "../models/Inbox";
import { Client } from "../models/Client";
import { getChatParticipants, getClientsForUser } from "./chatService";
import mongoose from "mongoose";

export interface NewMessagePayload {
  chatId: string;
  userId: string;
  message: string;
  attachments: string[];
}

export const sendMessage = async (
  chatId: mongoose.Types.ObjectId,
  senderId: mongoose.Types.ObjectId,
  content: string,
  attachments: string[] = []
) => {
  const participants = await getChatParticipants(chatId);
  if (participants.length === 0) {
    throw new Error("Chat not found or has no participants");
  }

  const message = await Message.create({
    chatId,
    senderId,
    content,
    attachments,
  });

  const clients = await Client.find({ userId: { $in: participants } });

  const inboxEntries = clients
    .filter((c) => !c.userId.equals(senderId))
    .map((c) => ({
      clientId: c._id,
      messageId: message._id,
      chatId,
    }));

  if (inboxEntries.length > 0) {
    await Inbox.insertMany(inboxEntries);
  }

  return {
    message,
    recipientClientIds: inboxEntries.map((e) => e.clientId.toString()),
    recipientUserIds: inboxEntries.map(
      (e) => clients.find((c) => c._id.equals(e.clientId))?.userId
    ),
  };
};

export const getMessagesForChat = async (
  chatId: mongoose.Types.ObjectId,
  limit = 50,
  before?: Date
) => {
  const query: Record<string, unknown> = { chatId };
  if (before) {
    query.createdAt = { $lt: before };
  }
  return Message.find(query)
    .populate("senderId", "name email")
    .sort({ createdAt: -1 })
    .limit(limit)
    .exec();
};

export const getUndeliveredMessagesForClient = async (
  clientId: mongoose.Types.ObjectId
) => {
  const inboxEntries = await Inbox.find({ clientId })
    .populate("messageId")
    .populate("chatId")
    .sort({ createdAt: 1 })
    .exec();

  const messages = inboxEntries
    .filter((e) => e.messageId)
    .map((e) => ({
      ...(e.messageId as any).toObject(),
      chatId: (e.chatId as any)?._id || e.chatId,
    }));

  return messages;
};

export const acknowledgeMessage = async (
  clientId: mongoose.Types.ObjectId,
  messageId: mongoose.Types.ObjectId
) => {
  await Inbox.deleteOne({ clientId, messageId });
};
