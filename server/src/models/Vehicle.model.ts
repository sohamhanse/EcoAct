import mongoose, { Schema, type Model } from "mongoose";

export type VehicleType = "two_wheeler" | "three_wheeler" | "four_wheeler" | "commercial";
export type FuelType = "petrol" | "diesel" | "cng" | "electric";

export interface IVehicle {
  userId: mongoose.Types.ObjectId;
  nickname: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  fuelType: FuelType;
  brand?: string;
  model?: string;
  yearOfManufacture?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function normalizeVehicleNumber(value: string): string {
  return String(value ?? "").replace(/\s+/g, "").toUpperCase().trim();
}

const vehicleSchema = new Schema<IVehicle>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    nickname: { type: String, required: true, trim: true },
    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      set: normalizeVehicleNumber,
    },
    vehicleType: {
      type: String,
      enum: ["two_wheeler", "three_wheeler", "four_wheeler", "commercial"],
      required: true,
    },
    fuelType: {
      type: String,
      enum: ["petrol", "diesel", "cng", "electric"],
      required: true,
    },
    brand: { type: String, default: "" },
    model: { type: String, default: "" },
    yearOfManufacture: { type: Number, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

vehicleSchema.index({ userId: 1, isActive: 1, createdAt: -1 });
vehicleSchema.index({ vehicleNumber: 1 });

export const Vehicle: Model<IVehicle> =
  mongoose.models.Vehicle ??
  mongoose.model<IVehicle>("Vehicle", vehicleSchema);
