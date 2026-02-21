import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IChallengeParticipant extends Document {
  challengeId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const challengeParticipantSchema = new Schema<IChallengeParticipant>(
  {
    challengeId: { type: Schema.Types.ObjectId, ref: "CommunityChallenge", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

challengeParticipantSchema.index({ challengeId: 1, userId: 1 }, { unique: true });

export const ChallengeParticipant: Model<IChallengeParticipant> =
  mongoose.models.ChallengeParticipant ??
  mongoose.model<IChallengeParticipant>("ChallengeParticipant", challengeParticipantSchema);
