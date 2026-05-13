import express from "express";
import {
  signup,
  signin,
  signout,
  refreshToken,
} from "../controllers/authController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/refresh", refreshToken);
router.post("/signout", protectedRoute, signout);

export default router;
