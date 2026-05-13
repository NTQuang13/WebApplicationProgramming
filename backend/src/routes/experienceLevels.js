import express from "express";
import { getExperienceLevels } from "../controllers/experienceLevelController.js";

const router = express.Router();

router.get("/", getExperienceLevels);

export default router;
