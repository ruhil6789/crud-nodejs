import mongoose, { Document, Schema } from "mongoose";

export interface IAttachment extends Document {
  clientId: mongoose.Types.ObjectId;
  messageId?: mongoose.Types.ObjectId;
  url: string;
  hash?: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}

const attachmentSchema = new Schema<IAttachment>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    messageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    url: {
      type: String,
      required: true,
    },
    hash: {
      type: String,
      trim: true,
    },
    mimeType: {
      type: String,
      default: "application/octet-stream",
    },
    size: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Attachment = mongoose.model<IAttachment>("Attachment", attachmentSchema);
