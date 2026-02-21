export function isConsecutiveDay(lastActive: Date | null, today: Date): boolean {
  if (!lastActive) return true;
  const last = new Date(lastActive);
  last.setHours(0, 0, 0, 0);
  const t = new Date(today);
  t.setHours(0, 0, 0, 0);
  const diffMs = t.getTime() - last.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  return diffDays === 1;
}

export function updateStreak(
  lastActiveDate: Date | null,
  currentStreak: number,
  longestStreak: number,
  today: Date,
): { currentStreak: number; longestStreak: number } {
  const last = lastActiveDate ? new Date(lastActiveDate) : null;
  const t = new Date(today);
  t.setHours(0, 0, 0, 0);
  if (!last) {
    return { currentStreak: 1, longestStreak: Math.max(1, longestStreak) };
  }
  const lastDay = new Date(last);
  lastDay.setHours(0, 0, 0, 0);
  const diffMs = t.getTime() - lastDay.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays === 0) return { currentStreak, longestStreak };
  if (diffDays === 1) {
    const next = currentStreak + 1;
    return { currentStreak: next, longestStreak: Math.max(next, longestStreak) };
  }
  return { currentStreak: 1, longestStreak };
}
