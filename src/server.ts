import "dotenv/config"; // Load .env first (before routes that read S3_BUCKET, etc.)
import http from "http";
import path from "path";
import express, { Application } from "express";
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
import { setupSwagger } from "./config/swagger";
import { metricsMiddleware, metricsEndpoint } from "./config/metrics";

const app = express();
const PORT = process.env.PORT || 3002;
const httpServer = http.createServer(app);

// Middleware
app.use((req, _res, next) => {
  // Normalize double slashes so //uploads/file.svg works
  if (req.url.includes("//")) {
    req.url = req.url.replace(/\/+/g, "/");
  }
  next();
});
app.use(helmet({ contentSecurityPolicy: false })); // Disable CSP for WebSocket
app.use(cors()); // Enable CORS
app.use(morgan("dev")); // HTTP request logger
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Static files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/public", express.static(path.join(process.cwd(), "public")));
app.get("/chat", (_req, res) => res.sendFile(path.join(process.cwd(), "public", "index.html")));

// Swagger API docs (before rate limiter so docs always load)
setupSwagger(app);
app.get("/docs", (_req, res) => res.redirect(301, "/api-docs"));

// Prometheus metrics (before rate limiter so scrape is never blocked)
app.get("/metrics", metricsEndpoint);

// Apply rate limiting to all routes
app.use(rateLimiter);

// Prometheus request metrics
app.use(metricsMiddleware);

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
      const { seedDatabase } = await import("./seed/seedData");
      await seedDatabase();
    } catch (error) {
      console.warn("⚠️  MongoDB connection failed, starting server anyway");
    }

    let pubClient, subClient;
    const useRedis = !!(process.env.REDIS_URL || process.env.REDIS_PASSWORD);
    if (useRedis) {
      try {
        await connectRedis();
        initializeRateLimiters();
        console.log("✅ Rate limiters initialized (Redis)");
        const clients = await createRedisPubSubClients();
        pubClient = clients.pubClient;
        subClient = clients.subClient;
      } catch (error) {
        console.warn("⚠️  Redis connection failed:", (error as Error).message);
        console.warn("   Using in-memory rate limiting. Set REDIS_URL or REDIS_PASSWORD for Redis.");
        initializeRateLimiters();
      }
    } else {
      initializeRateLimiters();
      console.log("✅ Rate limiters initialized (in-memory)");
      console.log("   Set REDIS_URL or REDIS_PASSWORD in .env to use Redis");
    }

    const { isS3Configured } = await import("./config/s3");
    if (isS3Configured()) {
      console.log(`📦 S3 uploads enabled (bucket: ${process.env.S3_BUCKET})`);
    } else {
      console.log("📁 File uploads: local ./uploads (set S3_BUCKET for S3)");
    }

    setupSocketServer(httpServer, pubClient, subClient);
    console.log("✅ WebSocket server initialized");

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 Swagger docs: http://localhost:${PORT}/api-docs`);
      console.log(`📊 Prometheus metrics: http://localhost:${PORT}/metrics`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
