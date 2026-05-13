import express from "express";
import {
  changePassword,
  getMe,
  getUserById,
  updateProfile,
} from "../controllers/userController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/me", protectedRoute, getMe);
router.get("/:id", protectedRoute, getUserById);
router.put("/me", protectedRoute, updateProfile);
router.put("/password", protectedRoute, changePassword);

export default router;
