import mongoose, { Schema, type Document, type Model } from "mongoose";

export type ActivityType =
  | "mission_complete"
  | "member_joined"
  | "badge_earned"
  | "challenge_completed"
  | "milestone";

export interface ICommunityActivityMetadata {
  missionTitle?: string;
  missionCo2Saved?: number;
  missionCategory?: string;
  badgeName?: string;
  milestoneValue?: number;
  milestoneUnit?: string;
  milestoneLabel?: string;
}

export interface ICommunityActivity extends Document {
  communityId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId | null;
  type: ActivityType;
  metadata: ICommunityActivityMetadata;
  createdAt: Date;
}

const communityActivitySchema = new Schema<ICommunityActivity>(
  {
    communityId: { type: Schema.Types.ObjectId, ref: "Community", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    type: {
      type: String,
      enum: ["mission_complete", "member_joined", "badge_earned", "challenge_completed", "milestone"],
      required: true,
    },
    metadata: {
      missionTitle: String,
      missionCo2Saved: Number,
      missionCategory: String,
      badgeName: String,
      milestoneValue: Number,
      milestoneUnit: String,
      milestoneLabel: String,
    },
  },
  { timestamps: true },
);

communityActivitySchema.index({ communityId: 1, createdAt: -1 });

export const CommunityActivity: Model<ICommunityActivity> =
  mongoose.models.CommunityActivity ??
  mongoose.model<ICommunityActivity>("CommunityActivity", communityActivitySchema);
