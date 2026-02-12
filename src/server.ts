import http from "http";
import path from "path";
import express, { Application } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { connectDB } from "./config/database";
import { connectRedis, createRedisPubSubClients } from "./config/redis";
import { rateLimiter, initializeRateLimiters } from "./middleware/rateLimiter";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import userRoutes from "./routes/userRoutes";
import chatRoutes from "./routes/chatRoutes";
import attachmentRoutes from "./routes/attachmentRoutes";
import { setupSocketServer } from "./socket";

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3002;
const httpServer = http.createServer(app);

// Middleware
app.use(helmet({ contentSecurityPolicy: false })); // Disable CSP for WebSocket
app.use(cors()); // Enable CORS
app.use(morgan("dev")); // HTTP request logger
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Static files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/public", express.static(path.join(process.cwd(), "public")));
app.get("/chat", (_req, res) => res.sendFile(path.join(process.cwd(), "public", "index.html")));

// Apply rate limiting to all routes
app.use(rateLimiter);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API is running successfully",
    timestamp: new Date().toISOString(),
    features: ["users", "chats", "messages", "attachments", "websocket"],
  });
});


app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/attachments", attachmentRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Try to connect to MongoDB
    try {
      await connectDB();
    } catch (error) {
      console.warn("⚠️  MongoDB connection failed, starting server anyway");
    }

    let pubClient, subClient;
    try {
      await connectRedis();
      initializeRateLimiters();
      console.log("✅ Rate limiters initialized");

      const clients = await createRedisPubSubClients();
      pubClient = clients.pubClient;
      subClient = clients.subClient;
    } catch (error) {
      console.warn("⚠️  Redis connection failed, rate limiting and Socket.io pub/sub will be disabled");
    }

    setupSocketServer(httpServer, pubClient, subClient);
    console.log("✅ WebSocket server initialized");

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
