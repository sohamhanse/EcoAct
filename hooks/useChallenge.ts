import { getActiveChallenge } from "@/api/challenge.api";
import type { CommunityChallengeResponse } from "@/src/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const SEEN_PREFIX = "ecoact_challenge_seen_";

export function useChallenge(communityId: string | null) {
  const [challenge, setChallenge] = useState<CommunityChallengeResponse | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const fetchChallenge = useCallback(async () => {
    if (!communityId) {
      setChallenge(null);
      return;
    }
    try {
      const data = await getActiveChallenge(communityId);
      if (data?.status === "completed") {
        const seen = await AsyncStorage.getItem(SEEN_PREFIX + data._id);
        if (!seen) {
          setShowCelebration(true);
          await AsyncStorage.setItem(SEEN_PREFIX + data._id, "true");
        }
      }
      setChallenge(data ?? null);
    } catch {
      setChallenge(null);
    }
  }, [communityId]);

  useEffect(() => {
    fetchChallenge();
    const interval = setInterval(fetchChallenge, 60000);
    return () => clearInterval(interval);
  }, [fetchChallenge]);

  return {
    challenge,
    showCelebration,
    dismissCelebration: () => setShowCelebration(false),
    refetch: fetchChallenge,
  };
}
