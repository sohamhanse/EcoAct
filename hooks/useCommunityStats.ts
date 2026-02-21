import { useCallback, useEffect, useState } from "react";
import { getCommunityStats } from "@/api/communityStats.api";
import type { CommunityStatsResponse } from "@/src/types";

export function useCommunityStats(communityId: string | null) {
  const [stats, setStats] = useState<CommunityStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!communityId) {
      setStats(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await getCommunityStats(communityId);
      setStats(data ?? null);
    } catch {
      setError("Failed to load community stats");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
