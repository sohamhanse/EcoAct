import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IUserMission extends Document {
  userId: mongoose.Types.ObjectId;
  missionId: mongoose.Types.ObjectId;
  completedAt: Date;
  pointsAwarded: number;
  co2SavedAwarded: number;
  streakMultiplier: number;
}

const userMissionSchema = new Schema<IUserMission>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    missionId: { type: Schema.Types.ObjectId, ref: "Mission", required: true },
    completedAt: { type: Date, default: Date.now },
    pointsAwarded: { type: Number, required: true },
    co2SavedAwarded: { type: Number, required: true },
    streakMultiplier: { type: Number, default: 1 },
  },
  { timestamps: true },
);

userMissionSchema.index({ userId: 1, missionId: 1 });
userMissionSchema.index({ userId: 1, completedAt: -1 });

export const UserMission: Model<IUserMission> =
  mongoose.models.UserMission ?? mongoose.model<IUserMission>("UserMission", userMissionSchema);
