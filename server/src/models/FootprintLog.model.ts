import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IFootprintAnswers {
  state?: string;
  city?: string;
  vehicleType?: string;
  engineSize?: string;
  carKmPerWeek: number;
  twoWheelerKmPerWeek?: number;
  publicTransportMode?: string;
  publicTransportKmPerWeek?: number;
  flightsPerYear: number;
  dietType: string;
  acHoursPerDay?: number;
  acTonnage?: string;
  electricityRange: string;
  onlinePurchasesPerMonth: number;
  // Legacy fields for backward compatibility
  publicTransportFrequency?: string;
  meatFrequency?: string;
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
  gridFactorUsed?: number;
  comparedToIndiaAvg?: number;
  loggedAt: Date;
}

const footprintLogSchema = new Schema<IFootprintLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    answers: {
      state: String,
      city: String,
      vehicleType: String,
      engineSize: String,
      carKmPerWeek: Number,
      twoWheelerKmPerWeek: Number,
      publicTransportMode: String,
      publicTransportKmPerWeek: Number,
      flightsPerYear: Number,
      dietType: String,
      acHoursPerDay: Number,
      acTonnage: String,
      electricityRange: String,
      onlinePurchasesPerMonth: Number,
      publicTransportFrequency: String,
      meatFrequency: String,
    },
    totalCo2: { type: Number, required: true },
    breakdown: {
      transport: Number,
      food: Number,
      energy: Number,
      shopping: Number,
    },
    gridFactorUsed: Number,
    comparedToIndiaAvg: Number,
    loggedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

footprintLogSchema.index({ userId: 1, loggedAt: -1 });

export const FootprintLog: Model<IFootprintLog> =
  mongoose.models.FootprintLog ?? mongoose.model<IFootprintLog>("FootprintLog", footprintLogSchema);
