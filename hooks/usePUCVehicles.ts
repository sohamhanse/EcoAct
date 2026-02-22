import { useCallback, useEffect, useState } from "react";
import { getPUCDashboard } from "@/api/puc.api";
import type { ApiPUCDashboard } from "@/src/types";
import { usePUCStore } from "@/store/usePUCStore";

export function usePUCVehicles() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dashboard = usePUCStore((s) => s.dashboard);
  const setDashboard = usePUCStore((s) => s.setDashboard);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data: ApiPUCDashboard = await getPUCDashboard();
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vehicles");
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  }, [setDashboard]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { dashboard, loading, error, refetch };
}

