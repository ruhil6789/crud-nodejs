import { Request, Response, NextFunction } from "express";

export const validateUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { name, email } = req.body;

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    res.status(400).json({
      success: false,
      error: "Name is required and must be at least 2 characters",
    });
    return;
  }

  if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
    res.status(400).json({
      success: false,
      error: "Valid email is required",
    });
    return;
  }

  next();
};
