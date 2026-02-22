import mongoose, { Schema, type Document, type Model } from "mongoose";

export type CommunityEventStatus = "draft" | "published" | "archived";

export interface ICommunityEvent extends Document {
  communityId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  startAt: Date;
  endAt: Date;
  location: string;
  coverImageUrl: string;
  status: CommunityEventStatus;
  maxParticipants: number | null;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const communityEventSchema = new Schema<ICommunityEvent>(
  {
    communityId: { type: Schema.Types.ObjectId, ref: "Community", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    location: { type: String, default: "" },
    coverImageUrl: { type: String, default: "" },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    maxParticipants: { type: Number, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

communityEventSchema.index({ communityId: 1, status: 1, startAt: 1 });
communityEventSchema.index({ communityId: 1, createdAt: -1 });

export const CommunityEvent: Model<ICommunityEvent> =
  mongoose.models.CommunityEvent ??
  mongoose.model<ICommunityEvent>("CommunityEvent", communityEventSchema);
