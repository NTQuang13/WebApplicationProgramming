import express from "express";
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
} from "../controllers/jobController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import { isRecruiter } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getJobs);
router.get("/:id", getJobById);

// Protected routes (Only Recruiter)
router.post("/", protectedRoute, isRecruiter, createJob);
router.put("/:id", protectedRoute, isRecruiter, updateJob);
router.delete("/:id", protectedRoute, isRecruiter, deleteJob);

export default router;
