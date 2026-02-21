import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import { apiLimiter } from "./middleware/rateLimit.middleware.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import calculatorRoutes from "./routes/calculator.routes.js";
import missionRoutes from "./routes/mission.routes.js";
import leaderboardRoutes from "./routes/leaderboard.routes.js";
import communityRoutes from "./routes/community.routes.js";
import userRoutes from "./routes/user.routes.js";

const PORT = parseInt(process.env.PORT ?? "5000", 10);
const MONGODB_URI = process.env.MONGODB_URI ?? "mongodb://localhost:27017/ecotrack";

const app = express();
app.use(helmet());
app.use(cors({ origin: true }));
app.use(morgan("combined"));
app.use(express.json());
app.use(apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/calculator", calculatorRoutes);
app.use("/api/missions", missionRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/user", userRoutes);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use(errorMiddleware);

async function main() {
  await connectDB(MONGODB_URI);
  app.listen(PORT, () => console.log(`EcoTrack server listening on port ${PORT}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
