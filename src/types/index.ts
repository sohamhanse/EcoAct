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
