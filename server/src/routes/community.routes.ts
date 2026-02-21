import { Router } from "express";
import * as communityController from "../controllers/community.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", communityController.list);
router.get("/mine", authMiddleware, communityController.mine);
router.post("/leave", authMiddleware, communityController.leave);
router.get("/:id", communityController.getById);
router.post("/:id/join", authMiddleware, communityController.join);

export default router;
