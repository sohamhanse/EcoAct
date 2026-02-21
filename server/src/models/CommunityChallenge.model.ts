import mongoose, { Schema, type Document, type Model } from "mongoose";

export type ChallengeStatus = "active" | "completed" | "failed" | "upcoming";

export interface ICommunityChallenge extends Document {
  communityId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  goalCo2Kg: number;
  currentCo2Kg: number;
  startDate: Date;
  endDate: Date;
  status: ChallengeStatus;
  completedAt: Date | null;
  participantCount: number;
  createdAt: Date;
}

const communityChallengeSchema = new Schema<ICommunityChallenge>(
  {
    communityId: { type: Schema.Types.ObjectId, ref: "Community", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    goalCo2Kg: { type: Number, required: true },
    currentCo2Kg: { type: Number, default: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["active", "completed", "failed", "upcoming"],
      default: "active",
    },
    completedAt: { type: Date, default: null },
    participantCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

communityChallengeSchema.index({ communityId: 1, status: 1 });
communityChallengeSchema.index({ communityId: 1, startDate: 1, endDate: 1 });

export const CommunityChallenge: Model<ICommunityChallenge> =
  mongoose.models.CommunityChallenge ??
  mongoose.model<ICommunityChallenge>("CommunityChallenge", communityChallengeSchema);
