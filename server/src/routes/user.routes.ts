import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/profile", authMiddleware, userController.profile);
router.get("/badges", authMiddleware, userController.badges);
router.get("/streak-calendar", authMiddleware, userController.streakCalendar);
router.patch("/settings", authMiddleware, userController.settings);

export default router;
