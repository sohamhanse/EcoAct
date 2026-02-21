import { Router } from "express";
import * as calculatorController from "../controllers/calculator.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/submit", authMiddleware, calculatorController.submit);
router.get("/history", authMiddleware, calculatorController.history);
router.get("/latest", authMiddleware, calculatorController.latest);

export default router;
