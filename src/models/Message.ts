import mongoose, { Document, Schema } from "mongoose";

export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
  ttl?: Date; // For auto-cleanup after 30 days
}

const messageSchema = new Schema<IMessage>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      default: "",
      maxlength: [10000, "Message cannot exceed 10000 characters"],
    },
    attachments: [
      {
        type: String,
        trim: true,
      },
    ],
    ttl: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ ttl: 1 }, { expireAfterSeconds: 0 });

export const Message = mongoose.model<IMessage>("Message", messageSchema);
