export type MissionCategory = "transport" | "food" | "energy" | "shopping" | "water";
export type MissionDifficulty = "easy" | "medium" | "hard";

export interface ApiUser {
  _id: string;
  name: string;
  email: string;
  avatar: string;
  totalPoints: number;
  totalCo2Saved: number;
  footprintBaseline: number;
  currentStreak: number;
  longestStreak: number;
  badges: { badgeId: string; earnedAt: string }[];
  communityId: string | null;
  role: "user" | "admin";
}

export interface ApiMission {
  _id: string;
  title: string;
  description: string;
  category: MissionCategory;
  co2Saved: number;
  basePoints: number;
  difficulty: MissionDifficulty;
  icon: string;
  isActive: boolean;
}

export interface ApiCommunity {
  _id: string;
  name: string;
  type: "college" | "city" | "company";
  description: string;
  memberCount: number;
  totalCo2Saved: number;
  totalPoints: number;
}

export interface ApiCommunityEvent {
  _id: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  location: string;
  coverImageUrl: string;
  maxParticipants: number | null;
  rsvps: number;
  attended: number;
  myStatus?: "registered" | "attended" | "cancelled" | null;
}

export interface ApiCommunityQuiz {
  _id: string;
  title: string;
  description: string;
  startAt: string | null;
  endAt: string | null;
  timeLimitMinutes: number | null;
  passingScore: number;
  questionCount: number;
  attempts: number;
  avgScore: number;
}

export interface ApiCommunityQuizDetail {
  _id: string;
  title: string;
  description: string;
  passingScore: number;
  timeLimitMinutes: number | null;
  startAt: string | null;
  endAt: string | null;
  isActive: boolean;
  questions: Array<{
    index: number;
    prompt: string;
    options: string[];
  }>;
  lastAttempt: {
    scorePercent: number;
    passed: boolean;
    completedAt: string;
  } | null;
}

export interface ApiQuizAttemptResult {
  attempt: {
    _id: string;
    quizId: string;
    scorePercent: number;
    correctCount: number;
    totalQuestions: number;
    passed: boolean;
    completedAt: string;
  };
  questionResults: Array<{
    questionIndex: number;
    selectedIndex: number;
    correctIndex: number;
    isCorrect: boolean;
    explanation: string;
  }>;
}

export interface FootprintBreakdown {
  transport: number;
  food: number;
  energy: number;
  shopping: number;
}

export interface ApiFootprintLog {
  _id: string;
  totalCo2: number;
  breakdown: FootprintBreakdown;
  loggedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  _id: string;
  name: string;
  avatar: string;
  totalPoints: number;
  totalCo2Saved: number;
}

export type ChallengeStatus = "active" | "completed" | "failed" | "upcoming";

export interface CommunityChallengeResponse {
  _id: string;
  title: string;
  description: string;
  goalCo2Kg: number;
  currentCo2Kg: number;
  progressPercent: number;
  daysRemaining: number;
  hoursRemaining: number;
  status: ChallengeStatus;
  participantCount: number;
  startDate: string;
  endDate: string;
  completedAt: string | null;
}

export type ActivityType =
  | "mission_complete"
  | "member_joined"
  | "badge_earned"
  | "challenge_completed"
  | "milestone";

export interface ActivityFeedItem {
  _id: string;
  type: ActivityType;
  user: { name: string; avatar: string } | null;
  text: string;
  subtext: string;
  icon: string;
  iconColor: string;
  timeAgo: string;
  createdAt: string;
}

export interface CommunityStatsResponse {
  community: { name: string; type: string; memberCount: number };
  stats: {
    totalCo2SavedAllTime: number;
    thisMonthCo2: number;
    lastMonthCo2: number;
    monthOverMonthChange: number;
    thisMonthMissions: number;
    avgCo2PerMember: number;
  };
  weeklyTrend: Array<{ date: string; dayLabel: string; co2Saved: number; missionCount: number }>;
  topContributors: Array<{
    rank: number;
    userId: string;
    name: string;
    avatar: string;
    co2Saved: number;
    missionCount: number;
  }>;
}

export * from "./puc.types";
