import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import { isRecruiter } from "../middlewares/roleMiddleware.js";
import {
  uploadCV,
  getCVs,
  getCVById,
  downloadMyCV,
  downloadCandidateCvAsRecruiter,
  searchCVs,
} from "../controllers/cvController.js";

const router = express.Router();

// Đảm bảo thư mục upload tồn tại
const uploadDir = "uploads/cvs/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình Multer để lưu file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

const uploadSingleFile = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "File lỗi/exceeds 5MB" });
    }
    return res.status(400).json({ message: "File lỗi" });
  });
};

// Routes
router.post("/upload", protectedRoute, uploadSingleFile, uploadCV);
router.get("/search", protectedRoute, isRecruiter, searchCVs);
router.get("/", protectedRoute, getCVs);
router.get("/:id/recruiter-download", protectedRoute, isRecruiter, downloadCandidateCvAsRecruiter);
router.get("/:id/download", protectedRoute, downloadMyCV);
router.get("/:id", protectedRoute, getCVById);

export default router;
