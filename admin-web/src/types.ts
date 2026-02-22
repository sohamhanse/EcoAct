export type AdminRole = "admin";

export interface AdminCommunity {
  _id: string;
  name: string;
  type: "college" | "city" | "company";
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: AdminRole;
  communityId: string | null;
  createdAt?: string;
  community: AdminCommunity | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface OverviewKpis {
  totalMembers: number;
  activeMembers7d: number;
  activeMembers30d: number;
  totalCo2Saved: number;
  totalPoints: number;
  missionsCompleted: number;
  co2SavedInRange: number;
  pointsInRange: number;
  eventsInRange: number;
  eventRsvpsInRange: number;
  quizzesInRange: number;
  quizAttemptsInRange: number;
  quizAverageScoreInRange: number;
}

export interface OverviewResponse {
  community: AdminCommunity;
  dateRange: { from: string; to: string };
  kpis: OverviewKpis;
}

export interface TimeseriesRow {
  bucket: string;
  co2Saved: number;
  missionsCompleted: number;
  activeUsers: number;
  eventRsvps: number;
  quizAttempts: number;
  avgQuizScore: number;
}

export interface TimeseriesResponse {
  granularity: "daily" | "weekly" | "monthly";
  from: string;
  to: string;
  series: TimeseriesRow[];
}

export type AdminEventStatus = "draft" | "published" | "archived";

export interface AdminEvent {
  _id: string;
  communityId: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  location: string;
  coverImageUrl: string;
  status: AdminEventStatus;
  maxParticipants: number | null;
  createdBy: string;
  updatedBy: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  stats?: { rsvps: number; attended: number; cancelled: number };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface QuizQuestion {
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
}

export type AdminQuizStatus = "draft" | "published" | "archived";

export interface AdminQuiz {
  _id: string;
  communityId: string;
  title: string;
  description: string;
  status: AdminQuizStatus;
  startAt: string | null;
  endAt: string | null;
  timeLimitMinutes: number | null;
  passingScore: number;
  questions: QuizQuestion[];
  createdBy: string;
  updatedBy: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  questionCount?: number;
  stats?: { attempts: number; avgScore: number };
}

export interface QuizAnalyticsResponse {
  quiz: {
    _id: string;
    title: string;
    status: AdminQuizStatus;
    questionCount: number;
    passingScore: number;
  };
  summary: {
    attempts: number;
    completionRate: number;
    averageScore: number;
    passRate: number;
  };
  topQuestions: Array<{ index: number; prompt: string; answered: number; correct: number; accuracy: number }>;
  bottomQuestions: Array<{ index: number; prompt: string; answered: number; correct: number; accuracy: number }>;
  leaderboard: Array<{ userId: string; name: string; scorePercent: number; completedAt: string }>;
}
