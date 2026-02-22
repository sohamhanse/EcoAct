import { useCallback, useEffect, useState } from "react";
import {
  getActiveMilestones,
  getMilestoneHistory,
  type ActiveMilestone,
  type MilestoneHistoryItem,
} from "@/api/milestone.api";

export function useMilestones() {
  const [active, setActive] = useState<ActiveMilestone[]>([]);
  const [history, setHistory] = useState<MilestoneHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [activeRes, historyRes] = await Promise.all([
        getActiveMilestones(),
        getMilestoneHistory({ page: 1, limit: 10 }),
      ]);
      setActive(activeRes.milestones);
      setHistory(historyRes.milestones);
    } catch {
      setActive([]);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { active, history, loading, refetch: load };
}
