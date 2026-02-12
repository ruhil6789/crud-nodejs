import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";
import { Request, Response, NextFunction } from "express";
import RedisStore from "rate-limit-redis";
import { redisClient } from "../config/redis";

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"); // 15 minutes
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100");

let rateLimiterInstance: RateLimitRequestHandler | null = null;
let strictRateLimiterInstance: RateLimitRequestHandler | null = null;

export const initializeRateLimiters = (): void => {
  rateLimiterInstance = rateLimit({
    windowMs,
    max: maxRequests,
    message: {
      error: "Too many requests from this IP, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
      prefix: "rl:",
    } as any),
  });

  strictRateLimiterInstance = rateLimit({
    windowMs: 60000, // 1 minute
    max: 10,
    message: {
      error: "Too many requests, please slow down.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
      prefix: "rl:strict:",
    } as any),
  });
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
