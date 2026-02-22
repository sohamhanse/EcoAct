import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IBadgeEntry {
  badgeId: string;
  earnedAt: Date;
}

export interface IUser extends Document {
  googleId: string;
  name: string;
  email: string;
  avatar: string;
  expoPushToken: string | null;
  totalPoints: number;
  totalCo2Saved: number;
  footprintBaseline: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date | null;
  badges: IBadgeEntry[];
  communityId: mongoose.Types.ObjectId | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

const badgeEntrySchema = new Schema<IBadgeEntry>(
  { badgeId: String, earnedAt: { type: Date, default: Date.now } },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    googleId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    avatar: { type: String, default: "" },
    expoPushToken: { type: String, default: null },
    totalPoints: { type: Number, default: 0 },
    totalCo2Saved: { type: Number, default: 0 },
    footprintBaseline: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null },
    badges: { type: [badgeEntrySchema], default: [] },
    communityId: { type: Schema.Types.ObjectId, ref: "Community", default: null },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true },
);

userSchema.index({ communityId: 1 });
userSchema.index({ totalPoints: -1 });
userSchema.index({ totalCo2Saved: -1 });

export const User: Model<IUser> = mongoose.models.User ?? mongoose.model<IUser>("User", userSchema);
