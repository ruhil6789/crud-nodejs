import { Router } from "express";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/userController";
import { validateUser } from "../middleware/validator";
import { strictRateLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/", strictRateLimiter, validateUser, createUser);
router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/:id", validateUser, updateUser);
router.delete("/:id", deleteUser);

export default router;
