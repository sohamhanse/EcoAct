import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IRecurringMilestone extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  period: "weekly" | "monthly";
  periodKey: string;
  goal: {
    targetValue: number;
    unit: string;
    label: string;
  };
  progress: {
    currentValue: number;
    percentComplete: number;
  };
  status: "active" | "completed" | "failed";
  reward: {
    bonusPoints: number;
    badgeId: string | null;
  };
  completedAt: Date | null;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
}

const recurringMilestoneSchema = new Schema<IRecurringMilestone>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    period: { type: String, enum: ["weekly", "monthly"], required: true },
    periodKey: { type: String, required: true },
    goal: {
      targetValue: Number,
      unit: String,
      label: String,
    },
    progress: {
      currentValue: { type: Number, default: 0 },
      percentComplete: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ["active", "completed", "failed"],
      default: "active",
    },
    reward: {
      bonusPoints: Number,
      badgeId: { type: String, default: null },
    },
    completedAt: { type: Date, default: null },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

recurringMilestoneSchema.index({ userId: 1, periodKey: 1, type: 1 }, { unique: true });

export const RecurringMilestone: Model<IRecurringMilestone> =
  mongoose.models.RecurringMilestone ??
  mongoose.model<IRecurringMilestone>("RecurringMilestone", recurringMilestoneSchema);
