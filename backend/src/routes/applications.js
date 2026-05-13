import express from "express";
import {
  applyJob,
  getApplications,
  updateApplicationStatus,
  downloadApplicationCv,
} from "../controllers/applicationController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import { isRecruiter, isCandidate } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Route Nộp CV (Chỉ dành cho Candidate)
router.post("/", protectedRoute, isCandidate, applyJob);

// Route Lấy danh sách
router.get("/", protectedRoute, getApplications);

// Tải CV ứng viên (job thuộc recruiter)
router.get("/:id/cv-download", protectedRoute, isRecruiter, downloadApplicationCv);

// Route Cập nhật trạng thái (Bắt buộc phải là Recruiter)
router.patch(
  "/:id/status",
  protectedRoute,
  isRecruiter,
  updateApplicationStatus,
);

export default router;
