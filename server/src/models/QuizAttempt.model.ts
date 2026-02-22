import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IQuizAttempt extends Document {
  communityId: mongoose.Types.ObjectId;
  quizId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  answers: number[];
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
  startedAt: Date;
  completedAt: Date;
  durationSeconds: number;
  createdAt: Date;
  updatedAt: Date;
}

const quizAttemptSchema = new Schema<IQuizAttempt>(
  {
    communityId: { type: Schema.Types.ObjectId, ref: "Community", required: true },
    quizId: { type: Schema.Types.ObjectId, ref: "CommunityQuiz", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    answers: { type: [Number], default: [] },
    scorePercent: { type: Number, required: true },
    correctCount: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date, required: true },
    durationSeconds: { type: Number, default: 0 },
  },
  { timestamps: true },
);

quizAttemptSchema.index({ quizId: 1, completedAt: -1 });
quizAttemptSchema.index({ quizId: 1, userId: 1, completedAt: -1 });
quizAttemptSchema.index({ communityId: 1, completedAt: -1 });

export const QuizAttempt: Model<IQuizAttempt> =
  mongoose.models.QuizAttempt ??
  mongoose.model<IQuizAttempt>("QuizAttempt", quizAttemptSchema);
