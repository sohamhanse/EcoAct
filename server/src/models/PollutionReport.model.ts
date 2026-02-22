import mongoose, { Schema, type Document, type Model } from "mongoose";

export type PollutionVehicleType =
  | "two_wheeler"
  | "three_wheeler"
  | "four_wheeler"
  | "commercial_truck"
  | "bus"
  | "unknown";
export type PollutionLevel = "mild" | "heavy" | "severe";
export type PollutionType =
  | "black_smoke"
  | "white_smoke"
  | "strong_odor"
  | "visible_exhaust"
  | "multiple";
export type PollutionReportStatus = "pending" | "verified" | "dismissed";

export interface IPollutionReport extends Document {
  reporterId: mongoose.Types.ObjectId;
  vehicleNumber?: string;
  vehicleType: PollutionVehicleType;
  vehicleColor?: string;
  pollutionLevel: PollutionLevel;
  pollutionType: PollutionType;
  description?: string;
  location: {
    type: "Point";
    coordinates: [number, number];
  };
  locationName?: string;
  city: string;
  state: string;
  status: PollutionReportStatus;
  verificationCount: number;
  pointsAwarded: number;
  reportedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const pollutionReportSchema = new Schema<IPollutionReport>(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    vehicleNumber: { type: String, default: "" },
    vehicleType: {
      type: String,
      enum: ["two_wheeler", "three_wheeler", "four_wheeler", "commercial_truck", "bus", "unknown"],
      required: true,
    },
    vehicleColor: { type: String, default: "" },
    pollutionLevel: { type: String, enum: ["mild", "heavy", "severe"], required: true },
    pollutionType: {
      type: String,
      enum: ["black_smoke", "white_smoke", "strong_odor", "visible_exhaust", "multiple"],
      required: true,
    },
    description: { type: String, default: "", maxlength: 300 },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: { type: [Number], required: true },
    },
    locationName: { type: String, default: "" },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    status: { type: String, enum: ["pending", "verified", "dismissed"], default: "pending" },
    verificationCount: { type: Number, default: 0 },
    pointsAwarded: { type: Number, default: 0 },
    reportedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

pollutionReportSchema.index({ location: "2dsphere" });
pollutionReportSchema.index({ city: 1, reportedAt: -1 });
pollutionReportSchema.index({ reporterId: 1, reportedAt: -1 });

export const PollutionReport: Model<IPollutionReport> =
  mongoose.models.PollutionReport ??
  mongoose.model<IPollutionReport>("PollutionReport", pollutionReportSchema);

