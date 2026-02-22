import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import * as milestoneController from "../controllers/milestone.controller.js";

const router = Router();

router.get("/active", authMiddleware, milestoneController.getActive);
router.get("/history", authMiddleware, milestoneController.getHistory);
router.get("/summary", authMiddleware, milestoneController.getSummary);

export default router;
