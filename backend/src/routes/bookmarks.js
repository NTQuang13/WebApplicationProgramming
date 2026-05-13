import express from "express";
import {
  saveJob,
  getBookmarks,
  removeBookmark,
} from "../controllers/bookmarkController.js";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import { isCandidate } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Tất cả API Bookmarks đều bắt buộc phải đăng nhập và là ứng viên
router.use(protectedRoute, isCandidate);

router.post("/", saveJob); // Lưu job
router.get("/", getBookmarks); // Xem danh sách đã lưu
router.delete("/:jobId", removeBookmark); // Bỏ lưu job

export default router;
