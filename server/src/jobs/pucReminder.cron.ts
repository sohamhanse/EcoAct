import { sendPUCExpiryReminders } from "../services/puc.service.js";

let scheduleTimer: NodeJS.Timeout | null = null;

function msUntilNextUtcRun(targetHour: number, targetMinute: number): number {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(targetHour, targetMinute, 0, 0);
  if (next <= now) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return Math.max(1000, next.getTime() - now.getTime());
}

async function runAndReschedule(): Promise<void> {
  try {
    await sendPUCExpiryReminders();
    console.log("[CRON] PUC expiry reminders sent");
  } catch (err) {
    console.error("[CRON] PUC expiry reminder job failed:", err);
  } finally {
    const waitMs = msUntilNextUtcRun(3, 30);
    scheduleTimer = setTimeout(() => {
      runAndReschedule().catch((err) => console.error("[CRON] Scheduler failure:", err));
    }, waitMs);
  }
}

export function startPUCReminderCron(): void {
  if (scheduleTimer) return;
  const waitMs = msUntilNextUtcRun(3, 30);
  scheduleTimer = setTimeout(() => {
    runAndReschedule().catch((err) => console.error("[CRON] Scheduler failure:", err));
  }, waitMs);
  console.log("[CRON] PUC reminder scheduler initialized");
}

