import mongoose, { Schema, type Document, type Model } from "mongoose";

export type CommunityQuizStatus = "draft" | "published" | "archived";

export interface IQuizQuestion {
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
}

export interface ICommunityQuiz extends Document {
  communityId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: CommunityQuizStatus;
  startAt: Date | null;
  endAt: Date | null;
  timeLimitMinutes: number | null;
  passingScore: number;
  questions: IQuizQuestion[];
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const quizQuestionSchema = new Schema<IQuizQuestion>(
  {
    prompt: { type: String, required: true, trim: true },
    options: { type: [String], required: true },
    correctOptionIndex: { type: Number, required: true },
    explanation: { type: String, default: "" },
  },
  { _id: false },
);

const communityQuizSchema = new Schema<ICommunityQuiz>(
  {
    communityId: { type: Schema.Types.ObjectId, ref: "Community", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
    timeLimitMinutes: { type: Number, default: null },
    passingScore: { type: Number, default: 60 },
    questions: { type: [quizQuestionSchema], required: true, default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

communityQuizSchema.index({ communityId: 1, status: 1, createdAt: -1 });
communityQuizSchema.index({ communityId: 1, publishedAt: -1 });

export const CommunityQuiz: Model<ICommunityQuiz> =
  mongoose.models.CommunityQuiz ??
  mongoose.model<ICommunityQuiz>("CommunityQuiz", communityQuizSchema);
