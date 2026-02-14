import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";
import { Request, Response, NextFunction } from "express";
import RedisStore from "rate-limit-redis";
import { redisClient } from "../config/redis";

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"); // 15 minutes
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100");

let rateLimiterInstance: RateLimitRequestHandler | null = null;
let strictRateLimiterInstance: RateLimitRequestHandler | null = null;

const useRedisStore = (): boolean => {
  return !!(process.env.REDIS_URL || process.env.REDIS_PASSWORD);
};

export const initializeRateLimiters = (): void => {
  const commonOptions = {
    windowMs,
    max: maxRequests,
    message: { error: "Too many requests from this IP, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  };

  const strictOptions = {
    windowMs: 60000,
    max: 10,
    message: { error: "Too many requests, please slow down." },
    standardHeaders: true,
    legacyHeaders: false,
  };

  if (useRedisStore()) {
    try {
      rateLimiterInstance = rateLimit({
        ...commonOptions,
        store: new RedisStore({
          sendCommand: (...args: string[]) => redisClient.sendCommand(args),
          prefix: "rl:",
        } as any),
      });
      strictRateLimiterInstance = rateLimit({
        ...strictOptions,
        store: new RedisStore({
          sendCommand: (...args: string[]) => redisClient.sendCommand(args),
          prefix: "rl:strict:",
        } as any),
      });
      console.log("   Using Redis for rate limiting");
    } catch {
      console.warn("   Redis store failed, using in-memory rate limiting");
      rateLimiterInstance = rateLimit(commonOptions);
      strictRateLimiterInstance = rateLimit(strictOptions);
    }
  } else {
    rateLimiterInstance = rateLimit(commonOptions);
    strictRateLimiterInstance = rateLimit(strictOptions);
    console.log("   Using in-memory rate limiting");
  }
};

export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  if (!rateLimiterInstance) {
    return next();
  }
  return rateLimiterInstance(req, res, next);
};

export const strictRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  if (!strictRateLimiterInstance) {
    return next();
  }
  return strictRateLimiterInstance(req, res, next);
};
