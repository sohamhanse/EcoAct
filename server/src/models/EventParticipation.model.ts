import mongoose, { Schema, type Document, type Model } from "mongoose";

export type EventParticipationStatus = "registered" | "attended" | "cancelled";

export interface IEventParticipation extends Document {
  communityId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: EventParticipationStatus;
  registeredAt: Date;
  attendedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const eventParticipationSchema = new Schema<IEventParticipation>(
  {
    communityId: { type: Schema.Types.ObjectId, ref: "Community", required: true },
    eventId: { type: Schema.Types.ObjectId, ref: "CommunityEvent", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["registered", "attended", "cancelled"],
      default: "registered",
    },
    registeredAt: { type: Date, default: Date.now },
    attendedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

eventParticipationSchema.index({ eventId: 1, userId: 1 }, { unique: true });
eventParticipationSchema.index({ communityId: 1, eventId: 1, status: 1 });
eventParticipationSchema.index({ communityId: 1, registeredAt: -1 });

export const EventParticipation: Model<IEventParticipation> =
  mongoose.models.EventParticipation ??
  mongoose.model<IEventParticipation>("EventParticipation", eventParticipationSchema);
