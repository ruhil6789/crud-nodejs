import { createClient } from "redis";

function getRedisClient() {
  const url = process.env.REDIS_URL?.trim();
  if (url) {
    const cleanUrl = url.replace(/^['"]|['"]$/g, "");
    return createClient({ url: cleanUrl });
  }

  const redisHost = (process.env.REDIS_HOST || "localhost").replace(/^['"]|['"]$/g, "");
  const redisPort = parseInt(process.env.REDIS_PORT || "6379");
  const username = process.env.REDIS_USERNAME?.trim() || undefined;
  const password = process.env.REDIS_PASSWORD?.trim() || undefined;
  const useTls = process.env.REDIS_TLS === "true";

  const socketConfig: { host: string; port: number; tls?: boolean; rejectUnauthorized?: boolean } = {
    host: redisHost,
    port: redisPort,
  };

  if (useTls) {
    socketConfig.tls = true;
    socketConfig.rejectUnauthorized = process.env.REDIS_TLS_REJECT_UNAUTHORIZED !== "false";
  }

  const redisOptions: Record<string, unknown> = { socket: socketConfig };
  if (username && username.length > 0) redisOptions.username = username;
  if (password && password.length > 0) redisOptions.password = password;

  return createClient(redisOptions);
}

export const redisClient = getRedisClient();

export const createRedisPubSubClients = async () => {
  const pubClient = redisClient.duplicate();
  const subClient = redisClient.duplicate();
  await Promise.all([pubClient.connect(), subClient.connect()]);
  return { pubClient, subClient };
};

redisClient.on("error", (err) => {
  if (process.env.REDIS_URL || process.env.REDIS_PASSWORD) {
    console.error("❌ Redis Client Error:", err.message);
  }
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
    throw error;
  }
};
