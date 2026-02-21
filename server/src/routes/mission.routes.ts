import { Router } from "express";
import * as missionController from "../controllers/mission.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", missionController.list);
router.get("/recommended", authMiddleware, missionController.recommended);
router.post("/:id/complete", authMiddleware, missionController.complete);
router.get("/completed", authMiddleware, missionController.completed);
router.get("/stats", authMiddleware, missionController.stats);

export default router;
