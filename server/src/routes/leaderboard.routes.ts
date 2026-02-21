import { Router } from "express";
import * as leaderboardController from "../controllers/leaderboard.controller.js";

const router = Router();

router.get("/global", leaderboardController.global);
router.get("/community/:communityId", leaderboardController.community);
router.get("/weekly", leaderboardController.weekly);

export default router;
