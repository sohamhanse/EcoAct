import { useCallback, useEffect, useState } from "react";
import { getPollutionMapData } from "@/api/pollutionReport.api";
import type { ApiPollutionMapData, PollutionLevel } from "@/src/types";
import { usePUCStore } from "@/store/usePUCStore";

export function usePollutionMap(initial?: {
  lat?: number;
  lng?: number;
  radius?: number;
  hours?: number;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<"all" | PollutionLevel>("all");
  const [hours, setHours] = useState(initial?.hours ?? 24);
  const mapData = usePUCStore((s) => s.mapData);
  const setMapData = usePUCStore((s) => s.setMapData);
  const [center, setCenter] = useState({
    lat: initial?.lat ?? 19.076,
    lng: initial?.lng ?? 72.877,
    radius: initial?.radius ?? 10,
  });

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data: ApiPollutionMapData = await getPollutionMapData({
        lat: center.lat,
        lng: center.lng,
        radius: center.radius,
        hours,
      });
      setMapData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load map data");
      setMapData(null);
    } finally {
      setLoading(false);
    }
  }, [center.lat, center.lng, center.radius, hours, setMapData]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const filteredReports =
    levelFilter === "all"
      ? mapData?.reports ?? []
      : (mapData?.reports ?? []).filter((report) => report.pollutionLevel === levelFilter);

  return {
    loading,
    error,
    mapData,
    filteredReports,
    levelFilter,
    setLevelFilter,
    hours,
    setHours,
    center,
    setCenter,
    refetch,
  };
}

