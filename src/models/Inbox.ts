import mongoose, { Document, Schema } from "mongoose";

export interface IInbox extends Document {
  clientId: mongoose.Types.ObjectId;
  messageId: mongoose.Types.ObjectId;
  chatId: mongoose.Types.ObjectId;
  createdAt: Date;
  ttl?: Date;
}

const inboxSchema = new Schema<IInbox>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    messageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    ttl: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  {
    timestamps: true,
  }
);

inboxSchema.index({ clientId: 1 });
inboxSchema.index({ ttl: 1 }, { expireAfterSeconds: 0 });

export const Inbox = mongoose.model<IInbox>("Inbox", inboxSchema);
