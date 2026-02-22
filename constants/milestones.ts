export interface MilestoneTemplate {
  id: string;
  type: string;
  period: "weekly" | "monthly";
  targetValue: number;
  unit: "kg_co2" | "missions" | "days";
  label: string;
  description: string;
  bonusPoints: number;
  badgeId: string | null;
  difficulty: "easy" | "medium" | "hard";
  icon: string;
}

export const MILESTONE_ICONS: Record<string, string> = {
  "leaf-outline": "🍃",
  leaf: "🌿",
  "checkbox-outline": "☑",
  checkbox: "✓",
  "earth-outline": "🌍",
  earth: "🌎",
  trophy: "🏆",
  "checkmark-done": "✓",
  flame: "🔥",
};
