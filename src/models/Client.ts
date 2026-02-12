import mongoose, { Document, Schema } from "mongoose";

export interface IClient extends Document {
  userId: mongoose.Types.ObjectId;
  deviceId: string;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<IClient>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deviceId: {
      type: String,
      required: true,
      trim: true,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

clientSchema.index({ userId: 1 });
clientSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

export const Client = mongoose.model<IClient>("Client", clientSchema);
