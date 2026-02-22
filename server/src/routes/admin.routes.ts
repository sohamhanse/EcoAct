import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { communityAdminMiddleware } from "../middleware/communityAdmin.middleware.js";
import * as adminAuthController from "../controllers/adminAuth.controller.js";
import * as adminStatsController from "../controllers/adminStats.controller.js";
import * as adminEventController from "../controllers/adminEvent.controller.js";
import * as adminQuizController from "../controllers/adminQuiz.controller.js";

const router = Router();

router.post("/auth/demo-login", adminAuthController.demoLogin);
router.get("/auth/me", authMiddleware, adminAuthController.me);

const communityRouter = Router({ mergeParams: true });
communityRouter.use(authMiddleware, communityAdminMiddleware);

communityRouter.get("/stats/overview", adminStatsController.overview);
communityRouter.get("/stats/timeseries", adminStatsController.timeseries);

communityRouter.get("/events", adminEventController.list);
communityRouter.post("/events", adminEventController.create);
communityRouter.get("/events/:eventId", adminEventController.getById);
communityRouter.patch("/events/:eventId", adminEventController.update);
communityRouter.delete("/events/:eventId", adminEventController.remove);
communityRouter.post("/events/:eventId/publish", adminEventController.publish);
communityRouter.post("/events/:eventId/archive", adminEventController.archive);

communityRouter.get("/quizzes", adminQuizController.list);
communityRouter.post("/quizzes", adminQuizController.create);
communityRouter.get("/quizzes/:quizId", adminQuizController.getById);
communityRouter.patch("/quizzes/:quizId", adminQuizController.update);
communityRouter.delete("/quizzes/:quizId", adminQuizController.remove);
communityRouter.post("/quizzes/:quizId/publish", adminQuizController.publish);
communityRouter.post("/quizzes/:quizId/archive", adminQuizController.archive);
communityRouter.get("/quizzes/:quizId/analytics", adminQuizController.analytics);

router.use("/community/:communityId", communityRouter);

export default router;
