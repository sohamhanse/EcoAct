import mongoose, { Schema, type Document, type Model } from "mongoose";

export type CommunityType = "college" | "city" | "company";

export interface ICommunity extends Document {
  name: string;
  type: CommunityType;
  description: string;
  memberCount: number;
  totalCo2Saved: number;
  totalPoints: number;
  createdAt: Date;
}

const communitySchema = new Schema<ICommunity>(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["college", "city", "company"], required: true },
    description: { type: String, default: "" },
    memberCount: { type: Number, default: 0 },
    totalCo2Saved: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
  },
  { timestamps: true },
);

communitySchema.index({ type: 1 });
communitySchema.index({ totalCo2Saved: -1 });

export const Community: Model<ICommunity> =
  mongoose.models.Community ?? mongoose.model<ICommunity>("Community", communitySchema);
