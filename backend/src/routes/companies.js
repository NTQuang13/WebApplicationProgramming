import express from "express";
import { protectedRoute } from "../middlewares/authMiddleware.js";
import { isRecruiter } from "../middlewares/roleMiddleware.js";
import {
  createCompany,
  getCompanies,
  getCompanyById,
} from "../controllers/companyController.js"; // Import Đầu bếp

const router = express.Router();

router.post("/", protectedRoute, isRecruiter, createCompany);
router.get("/", getCompanies);
router.get("/:id", getCompanyById);

export default router;
