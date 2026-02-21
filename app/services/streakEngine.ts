const DAY_IN_MS = 24 * 60 * 60 * 1000;

function startOfDay(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function isYesterday(currentDateKey: string, previousDateKey: string): boolean {
  const current = startOfDay(currentDateKey).getTime();
  const previous = startOfDay(previousDateKey).getTime();
  return current - previous === DAY_IN_MS;
}

export function getDateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function calculateStreakAfterMission(params: {
  previousStreak: number;
  lastMissionCompletionDate: string | null;
  todayDateKey: string;
}): number {
  const { previousStreak, lastMissionCompletionDate, todayDateKey } = params;

  if (!lastMissionCompletionDate) {
    return 1;
  }

  if (lastMissionCompletionDate === todayDateKey) {
    return previousStreak;
  }

  if (isYesterday(todayDateKey, lastMissionCompletionDate)) {
    return previousStreak + 1;
  }

  return 1;
}

export function shouldResetStreak(params: {
  streak: number;
  lastMissionCompletionDate: string | null;
  todayDateKey: string;
}): boolean {
  if (params.streak === 0 || !params.lastMissionCompletionDate) {
    return false;
  }

  if (params.lastMissionCompletionDate === params.todayDateKey) {
    return false;
  }

  return !isYesterday(params.todayDateKey, params.lastMissionCompletionDate);
}
