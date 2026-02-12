import mongoose, { Document, Schema } from "mongoose";

export interface IChat extends Document {
  name: string;
  participants: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<IChat>(
  {
    name: {
      type: String,
      default: "",
      trim: true,
      maxlength: [100, "Chat name cannot exceed 100 characters"],
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

chatSchema.index({ participants: 1 });
chatSchema.index({ createdAt: -1 });

// Validate max 100 participants
chatSchema.pre("save", function (next) {
  if (this.participants.length > 100) {
    next(new Error("Chat cannot have more than 100 participants"));
  } else {
    next();
  }
});

export const Chat = mongoose.model<IChat>("Chat", chatSchema);
