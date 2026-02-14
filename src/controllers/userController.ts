import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import { redisClient } from "../config/redis";

const CACHE_TTL = 300; // 5 minutes

const safeRedisGet = async (key: string): Promise<string | null> => {
  try {
    return await redisClient.get(key);
  } catch {
    return null;
  }
};

const safeRedisSetEx = async (key: string, ttl: number, value: string): Promise<void> => {
  try {
    await redisClient.setEx(key, ttl, value);
  } catch {
    // ignore
  }
};

const safeRedisDel = async (...keys: string[]): Promise<void> => {
  try {
    for (const key of keys) {
      await redisClient.del(key);
    }
  } catch {
    // ignore
  }
};

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, age } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: "User with this email already exists",
      });
      return;
    }

    const user = await User.create({ name, email, age });

    await safeRedisDel("users:all");

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cachedUsers = await safeRedisGet("users:all");
    if (cachedUsers) {
      res.status(200).json({
        success: true,
        data: JSON.parse(cachedUsers),
        cached: true,
      });
      return;
    }

    const users = await User.find().sort({ createdAt: -1 });
    await safeRedisSetEx("users:all", CACHE_TTL, JSON.stringify(users));

    res.status(200).json({
      success: true,
      data: users,
      cached: false,
    });
  } catch (error: any) {
    next(error);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const cacheKey = `user:${id}`;
    const cachedUser = await safeRedisGet(cacheKey);
    if (cachedUser) {
      res.status(200).json({
        success: true,
        data: JSON.parse(cachedUser),
        cached: true,
      });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    await safeRedisSetEx(cacheKey, CACHE_TTL, JSON.stringify(user));

    res.status(200).json({
      success: true,
      data: user,
      cached: false,
    });
  } catch (error: any) {
    next(error);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, age } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { name, email, age },
      { new: true, runValidators: true }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    await safeRedisDel(`user:${id}`, "users:all");
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    await safeRedisDel(`user:${id}`, "users:all");
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error: any) {
    next(error);
  }
};
