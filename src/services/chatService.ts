import { Chat } from "../models/Chat";
import { Client } from "../models/Client";
import mongoose from "mongoose";

export const createChat = async (
  participants: mongoose.Types.ObjectId[],
  name: string,
  createdBy: mongoose.Types.ObjectId
) => {
  if (participants.length > 100) {
    throw new Error("Chat cannot have more than 100 participants");
  }
  if (!participants.includes(createdBy)) {
    participants.push(createdBy);
  }
  const chat = await Chat.create({ participants, name, createdBy });
  return chat;
};

export const getChatById = async (chatId: mongoose.Types.ObjectId) => {
  return Chat.findById(chatId)
    .populate("participants", "name email")
    .populate("createdBy", "name email")
    .exec();
};

export const getChatsForUser = async (userId: mongoose.Types.ObjectId) => {
  return Chat.find({ participants: userId })
    .populate("participants", "name email")
    .sort({ updatedAt: -1 })
    .exec();
};

export const getChatParticipants = async (chatId: mongoose.Types.ObjectId) => {
  const chat = await Chat.findById(chatId).select("participants").exec();
  return chat?.participants || [];
};

export const addParticipantToChat = async (
  chatId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId
) => {
  const chat = await Chat.findById(chatId);
  if (!chat) throw new Error("Chat not found");
  if (chat.participants.length >= 100) {
    throw new Error("Chat cannot have more than 100 participants");
  }
  if (!chat.participants.some((p) => p.equals(userId))) {
    chat.participants.push(userId);
    await chat.save();
  }
  return chat;
};

export const removeParticipantFromChat = async (
  chatId: mongoose.Types.ObjectId,
  userId: mongoose.Types.ObjectId
) => {
  const chat = await Chat.findById(chatId);
  if (!chat) throw new Error("Chat not found");
  chat.participants = chat.participants.filter((p) => !p.equals(userId));
  await chat.save();
  return chat;
};

export const getClientsForUser = async (userId: mongoose.Types.ObjectId) => {
  return Client.find({ userId }).exec();
};

export const registerOrUpdateClient = async (
  userId: mongoose.Types.ObjectId,
  deviceId: string
) => {
  return Client.findOneAndUpdate(
    { userId, deviceId },
    { lastSeenAt: new Date() },
    { upsert: true, new: true }
  );
};
