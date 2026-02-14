import mongoose from "mongoose";

const buildMongoUri = (): string => {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;

  const host = process.env.MONGODB_HOST || "localhost";
  const port = process.env.MONGODB_PORT || "27017";
  const database = process.env.MONGODB_DATABASE || "crud-app";
  const username = process.env.MONGODB_USERNAME;
  const password = process.env.MONGODB_PASSWORD;
  const authSource = process.env.MONGODB_AUTH_SOURCE || "admin";

  if (username && password) {
    return `mongodb://${encodeURIComponent(username)}:${encodeURIComponent(password)}@${host}:${port}/${database}?authSource=${authSource}`;
  }
  return `mongodb://${host}:${port}/${database}`;
};

export const connectDB = async (): Promise<void> => {
  const mongoUri = buildMongoUri();
  
  console.log(`Attempting to connect to MongoDB at: ${mongoUri.replace(/:[^:@]+@/, ":***@")}`);
  
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
