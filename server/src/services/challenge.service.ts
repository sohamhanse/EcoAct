import { CommunityChallenge } from "../models/CommunityChallenge.model.js";
import { ChallengeParticipant } from "../models/ChallengeParticipant.model.js";
import type { Types } from "mongoose";

const DEFAULT_CHALLENGES = [
  {
    title: "Save 500 kg CO₂ This Week",
    description: "Every mission counts. Bike, eat green, unplug — together we hit 500 kg.",
    goalCo2Kg: 500,
    durationDays: 7,
  },
  {
    title: "Hit 1,000 kg This Month",
    description: "Our biggest challenge yet. 30 days, 1,000 kg, one community.",
    goalCo2Kg: 1000,
    durationDays: 30,
  },
  {
    title: "100 kg Weekend Sprint",
    description: "Just 48 hours. Make every action count this weekend.",
    goalCo2Kg: 100,
    durationDays: 2,
  },
  {
    title: "Green Week: 250 kg Challenge",
    description: "Can we save 250 kg together in 7 days? Start with one mission today.",
    goalCo2Kg: 250,
    durationDays: 7,
  },
];

export async function contributeToCommunityChallenge(
  userId: string,
  co2Saved: number,
): Promise<void> {
  const { User } = await import("../models/User.model.js");
  const user = await User.findById(userId).select("communityId").lean();
  if (!user?.communityId) return;

  const now = new Date();
  const challenge = await CommunityChallenge.findOne({
    communityId: user.communityId,
    status: "active",
    startDate: { $lte: now },
    endDate: { $gte: now },
  });

  if (!challenge) return;

  challenge.currentCo2Kg += co2Saved;

  const alreadyParticipated = await ChallengeParticipant.exists({
    challengeId: challenge._id,
    userId,
  });
  if (!alreadyParticipated) {
    await ChallengeParticipant.create({
      challengeId: challenge._id,
      userId,
    });
    challenge.participantCount += 1;
  }

  if (
    challenge.currentCo2Kg >= challenge.goalCo2Kg &&
    challenge.status === "active"
  ) {
    challenge.status = "completed";
    challenge.completedAt = new Date();
    const { createChallengeCompleted } = await import("./communityActivity.service.js");
    await createChallengeCompleted(user.communityId, challenge.title);
  }

  await challenge.save();
}

export async function expireChallenges(): Promise<void> {
  await CommunityChallenge.updateMany(
    { status: "active", endDate: { $lt: new Date() } },
    { $set: { status: "failed" } },
  );
}

export async function ensureActiveChallenge(communityId: Types.ObjectId): Promise<void> {
  const now = new Date();
  const existing = await CommunityChallenge.findOne({
    communityId,
    status: "active",
    endDate: { $gte: now },
  });
  if (existing) return;

  const template =
    DEFAULT_CHALLENGES[Math.floor(Math.random() * DEFAULT_CHALLENGES.length)];
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + template.durationDays);

  await CommunityChallenge.create({
    communityId,
    title: template.title,
    description: template.description,
    goalCo2Kg: template.goalCo2Kg,
    currentCo2Kg: 0,
    startDate,
    endDate,
    status: "active",
    participantCount: 0,
  });
}
