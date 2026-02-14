import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import {
  createChat,
  getChatById,
  registerOrUpdateClient,
  addParticipantToChat,
  removeParticipantFromChat,
} from "../services/chatService";
import { sendMessage, getUndeliveredMessagesForClient, acknowledgeMessage } from "../services/messageService";
import mongoose from "mongoose";

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  clientId?: string;
}


export const setupSocketServer = (
  httpServer: HttpServer,
  pubClient?: Awaited<ReturnType<typeof import("../config/redis").createRedisPubSubClients>>["pubClient"],
  subClient?: Awaited<ReturnType<typeof import("../config/redis").createRedisPubSubClients>>["subClient"]
): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  if (pubClient && subClient) {
    io.adapter(createAdapter(pubClient, subClient));
    console.log("✅ Socket.io Redis adapter enabled");
  }

  io.use(async (socket: AuthenticatedSocket, next) => {
    const userId = socket.handshake.auth?.userId;
    const deviceId = socket.handshake.auth?.deviceId || socket.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return next(new Error("Authentication required: userId must be provided"));
    }

    try {
      const client = await registerOrUpdateClient(
        new mongoose.Types.ObjectId(userId),
        deviceId
      );
      socket.userId = userId;
      socket.clientId = client._id.toString();
      next();
    } catch (err) {
      next(new Error("Failed to register client"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const clientId = socket.clientId!;

    socket.join(`user:${userId}`);

    socket.on("createChat", async (payload: { participants: string[]; name?: string }, cb) => {
      try {
        const participantIds = payload.participants.map((p) => new mongoose.Types.ObjectId(p));
        const chat = await createChat(
          participantIds,
          payload.name || "",
          new mongoose.Types.ObjectId(userId)
        );
        socket.emit("chatUpdate", {
          chatId: chat._id.toString(),
          participants: chat.participants.map((p) => p.toString()),
        });
        cb?.({ chatId: chat._id.toString() });
      } catch (err: any) {
        cb?.({ error: err.message || "Failed to create chat" });
      }
    });

    socket.on("sendMessage", async (
      payload: { chatId: string; message: string; attachments?: string[] },
      cb
    ) => {
      try {
        const { message, recipientClientIds, recipientUserIds } = await sendMessage(
          new mongoose.Types.ObjectId(payload.chatId),
          new mongoose.Types.ObjectId(userId),
          payload.message || "",
          payload.attachments || []
        );

        const messagePayload = {
          chatId: payload.chatId,
          messageId: message._id.toString(),
          userId,
          message: payload.message,
          attachments: payload.attachments || [],
          createdAt: message.createdAt,
        };

        socket.emit("messageSent", messagePayload);
        cb?.("SUCCESS");

        const uniqueUserIds = [...new Set(recipientUserIds.map((id) => id?.toString()).filter(Boolean))];
        for (const recipientUserId of uniqueUserIds) {
          if (recipientUserId) {
            io.to(`user:${recipientUserId}`).emit("newMessage", messagePayload);
          }
        }
      } catch (err: any) {
        cb?.("FAILURE");
        socket.emit("error", { type: "sendMessage", message: err.message });
      }
    });

    socket.on("ack", async (payload: { messageId: string }, cb) => {
      try {
        await acknowledgeMessage(
          new mongoose.Types.ObjectId(clientId),
          new mongoose.Types.ObjectId(payload.messageId)
        );
        socket.emit("ackReceived", { messageId: payload.messageId });
        cb?.("RECEIVED");
      } catch (err: any) {
        cb?.({ error: err.message });
      }
    });

    socket.on("modifyChatParticipants", async (
      payload: { chatId: string; userId: string; operation: "ADD" | "REMOVE" },
      cb
    ) => {
      try {
        const chatId = new mongoose.Types.ObjectId(payload.chatId);
        const targetUserId = new mongoose.Types.ObjectId(payload.userId);

        if (payload.operation === "ADD") {
          await addParticipantToChat(chatId, targetUserId);
        } else {
          await removeParticipantFromChat(chatId, targetUserId);
        }

        const chat = await getChatById(chatId);
        socket.emit("chatUpdate", {
          chatId: payload.chatId,
          participants: chat?.participants.map((p) => p.toString()) || [],
        });
        cb?.("SUCCESS");
      } catch (err: any) {
        cb?.("FAILURE");
        socket.emit("error", { type: "modifyChatParticipants", message: err.message });
      }
    });

    socket.on("getUndeliveredMessages", async (cb) => {
      try {
        const messages = await getUndeliveredMessagesForClient(
          new mongoose.Types.ObjectId(clientId)
        );
        for (const msg of messages) {
          socket.emit("newMessage", {
            chatId: msg.chatId?.toString(),
            messageId: msg._id?.toString(),
            userId: msg.senderId?.toString(),
            message: msg.content,
            attachments: msg.attachments || [],
            createdAt: msg.createdAt,
          });
        }
        cb?.({ count: messages.length });
      } catch (err: any) {
        cb?.({ error: err.message, count: 0 });
      }
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${userId} (${clientId})`);
    });
  });

  return io;
};
