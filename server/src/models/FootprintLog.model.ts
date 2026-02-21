import mongoose, { Schema, type Document, type Model } from "mongoose";

export type PublicTransportFrequency = "daily" | "few_times_week" | "rarely" | "never";
export type DietType = "vegan" | "vegetarian" | "non_vegetarian";
export type MeatFrequency = "daily" | "few_times_week" | "rarely" | "never";
export type ElectricityRange = "low" | "medium" | "high" | "very_high";

export interface IFootprintAnswers {
  carKmPerWeek: number;
  publicTransportFrequency: PublicTransportFrequency;
  dietType: DietType;
  meatFrequency: MeatFrequency;
  acUsageHours: number;
  electricityRange: ElectricityRange;
  onlinePurchasesPerMonth: number;
  flightsPerYear: number;
}

export interface IFootprintBreakdown {
  transport: number;
  food: number;
  energy: number;
  shopping: number;
}

export interface IFootprintLog extends Document {
  userId: mongoose.Types.ObjectId;
  answers: IFootprintAnswers;
  totalCo2: number;
  breakdown: IFootprintBreakdown;
  loggedAt: Date;
}

const footprintLogSchema = new Schema<IFootprintLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    answers: {
      carKmPerWeek: Number,
      publicTransportFrequency: String,
      dietType: String,
      meatFrequency: String,
      acUsageHours: Number,
      electricityRange: String,
      onlinePurchasesPerMonth: Number,
      flightsPerYear: Number,
    },
    totalCo2: { type: Number, required: true },
    breakdown: {
      transport: Number,
      food: Number,
      energy: Number,
      shopping: Number,
    },
    loggedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

footprintLogSchema.index({ userId: 1, loggedAt: -1 });

export const FootprintLog: Model<IFootprintLog> =
  mongoose.models.FootprintLog ?? mongoose.model<IFootprintLog>("FootprintLog", footprintLogSchema);
