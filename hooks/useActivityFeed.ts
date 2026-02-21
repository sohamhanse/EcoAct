import { useCallback, useEffect, useState } from "react";
import { getCommunityFeed } from "@/api/feed.api";
import type { ActivityFeedItem } from "@/src/types";

export function useActivityFeed(communityId: string | null, options?: { limit?: number }) {
  const limit = options?.limit ?? 20;
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchFeed = useCallback(
    async (pageNum: number) => {
      if (!communityId) {
        setActivities([]);
        setLoading(false);
        return;
      }
      try {
        if (pageNum === 1) setLoading(true);
        const data = await getCommunityFeed(communityId, pageNum, limit);
        if (pageNum === 1) setActivities(data.activities);
        else setActivities((prev) => [...prev, ...data.activities]);
        setHasMore(data.hasMore);
      } catch {
        setActivities([]);
      } finally {
        setLoading(false);
      }
    },
    [communityId, limit],
  );

  useEffect(() => {
    fetchFeed(1);
    setPage(1);
    if (!communityId) return;
    const interval = setInterval(() => {
      getCommunityFeed(communityId, 1, 5).then((data) => {
        setActivities((prev) => {
          const existingIds = new Set(prev.map((a) => a._id));
          const newItems = data.activities.filter((a) => !existingIds.has(a._id));
          return newItems.length ? [...newItems, ...prev] : prev;
        });
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [communityId, fetchFeed]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    const next = page + 1;
    setPage(next);
    fetchFeed(next);
  }, [page, hasMore, loading, fetchFeed]);

  return { activities, loading, hasMore, loadMore, refetch: () => fetchFeed(1) };
}
