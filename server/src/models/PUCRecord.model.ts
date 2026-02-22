import mongoose, { Schema, type Document, type Model } from "mongoose";

export type PUCTestResult = "pass" | "fail";

export interface IPUCReadings {
  co?: number;
  hc?: number;
  smokeOpacity?: number;
  result: PUCTestResult;
}

export interface IPUCRecord extends Document {
  vehicleId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  testDate: Date;
  expiryDate: Date;
  pucCenterName?: string;
  pucCenterCity?: string;
  certificateNumber?: string;
  readings: IPUCReadings;
  pointsAwarded: number;
  co2ImpactKg: number;
  isOnTime: boolean;
  reminderSent: boolean;
  reminderSentDays: number[];
  createdAt: Date;
  updatedAt: Date;
}

const readingsSchema = new Schema<IPUCReadings>(
  {
    co: { type: Number, default: null },
    hc: { type: Number, default: null },
    smokeOpacity: { type: Number, default: null },
    result: { type: String, enum: ["pass", "fail"], default: "pass" },
  },
  { _id: false },
);

const pucRecordSchema = new Schema<IPUCRecord>(
  {
    vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    testDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    pucCenterName: { type: String, default: "" },
    pucCenterCity: { type: String, default: "" },
    certificateNumber: { type: String, default: "" },
    readings: { type: readingsSchema, default: { result: "pass" } },
    pointsAwarded: { type: Number, default: 0 },
    co2ImpactKg: { type: Number, default: 0 },
    isOnTime: { type: Boolean, default: true },
    reminderSent: { type: Boolean, default: false },
    reminderSentDays: { type: [Number], default: [] },
  },
  { timestamps: true },
);

pucRecordSchema.index({ vehicleId: 1, testDate: -1 });
pucRecordSchema.index({ userId: 1, expiryDate: 1 });

export const PUCRecord: Model<IPUCRecord> =
  mongoose.models.PUCRecord ??
  mongoose.model<IPUCRecord>("PUCRecord", pucRecordSchema);

