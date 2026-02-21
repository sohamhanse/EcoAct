import { Router } from "express";
import * as communityController from "../controllers/community.controller.js";
import * as challengeController from "../controllers/challenge.controller.js";
import * as communityStatsController from "../controllers/communityStats.controller.js";
import * as communityFeedController from "../controllers/communityFeed.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", communityController.list);
router.get("/mine", authMiddleware, communityController.mine);
router.post("/leave", authMiddleware, communityController.leave);
router.get("/:id/stats", communityStatsController.getStats);
router.get("/:id/feed", communityFeedController.getFeed);
router.get("/:id/challenge/active", challengeController.getActive);
router.get("/:id/challenge/history", challengeController.getHistory);
router.post("/:id/challenge", authMiddleware, challengeController.create);
router.get("/:id", communityController.getById);
router.post("/:id/join", authMiddleware, communityController.join);

export default router;
