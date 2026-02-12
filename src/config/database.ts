import mongoose from "mongoose";

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/crud-app";
  
  console.log(`Attempting to connect to MongoDB at: ${mongoUri}`);
  
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 10000,
    directConnection: true,
  });
  
  console.log("✅ MongoDB connected successfully");
};

mongoose.connection.on("disconnected", () => {
  console.log("⚠️  MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB error:", err);
});
