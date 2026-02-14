import { createClient } from "redis";

const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = parseInt(process.env.REDIS_PORT || "6379");
const password = process.env.REDIS_PASSWORD || undefined;
const useTls = process.env.REDIS_TLS === "true";

const socketConfig: { host: string; port: number; tls?: boolean; rejectUnauthorized?: boolean } = {
  host: redisHost.replace(/^['"]|['"]$/g, ""),
  port: redisPort,
};

if (useTls) {
  socketConfig.tls = true;
  socketConfig.rejectUnauthorized = process.env.REDIS_TLS_REJECT_UNAUTHORIZED !== "false";
}

export const redisClient = createClient({
  socket: socketConfig,
  password: password || undefined,
});

export const createRedisPubSubClients = async () => {
  const pubClient = redisClient.duplicate();
  const subClient = redisClient.duplicate();
  await Promise.all([pubClient.connect(), subClient.connect()]);
  return { pubClient, subClient };
};

redisClient.on("error", (err) => {
  console.error("❌ Redis Client Error:", err);
});

redisClient.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

redisClient.on("disconnect", () => {
  console.log("⚠️  Redis disconnected");
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error("❌ Redis connection error:", error);
    process.exit(1);
  }
};
