import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import * as leaderboardController from "../controllers/leaderboard.controller.js";

const router = Router();

router.get("/me", authMiddleware, leaderboardController.me);
router.get("/global", leaderboardController.global);
router.get("/community/:communityId", leaderboardController.community);
router.get("/weekly", leaderboardController.weekly);

export default router;
