import mongoose, { Schema, type Document, type Model } from "mongoose";

export type MissionCategory = "transport" | "food" | "energy" | "shopping" | "water";
export type MissionDifficulty = "easy" | "medium" | "hard";

export interface IMission extends Document {
  title: string;
  description: string;
  category: MissionCategory;
  co2Saved: number;
  basePoints: number;
  difficulty: MissionDifficulty;
  icon: string;
  isActive: boolean;
  createdAt: Date;
}

const missionSchema = new Schema<IMission>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: ["transport", "food", "energy", "shopping", "water"], required: true },
    co2Saved: { type: Number, required: true },
    basePoints: { type: Number, required: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
    icon: { type: String, default: "leaf" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

missionSchema.index({ category: 1, isActive: 1 });

export const Mission: Model<IMission> = mongoose.models.Mission ?? mongoose.model<IMission>("Mission", missionSchema);
