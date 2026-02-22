import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import * as pucController from "../controllers/puc.controller.js";
import * as pollutionReportController from "../controllers/pollutionReport.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/vehicles", pucController.listVehicles);
router.post("/vehicles", pucController.createVehicle);
router.patch("/vehicles/:id", pucController.updateVehicle);
router.delete("/vehicles/:id", pucController.deleteVehicle);
router.get("/vehicles/:id/status", pucController.vehicleStatus);
router.get("/vehicles/:id/history", pucController.vehicleHistory);
router.post("/vehicles/:id/log", pucController.logPUC);
router.get("/dashboard", pucController.dashboard);
router.get("/stats", pucController.stats);
router.get("/validity-preview", pucController.validityPreview);

router.post("/reports", pollutionReportController.createReport);
router.get("/reports/map", pollutionReportController.map);
router.get("/reports/my", pollutionReportController.myReports);
router.get("/reports/leaderboard", pollutionReportController.leaderboard);
router.get("/reports/city/:city", pollutionReportController.cityStats);
router.get("/reports/:id", pollutionReportController.detail);

export default router;

