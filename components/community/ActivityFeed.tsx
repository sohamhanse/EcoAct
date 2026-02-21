import React from "react";
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from "react-native";
import type { ActivityFeedItem } from "@/src/types";
import { ActivityRow } from "./ActivityRow";
import { COLORS } from "@/constants/colors";
import { SPACING } from "@/constants/spacing";
import { RADIUS } from "@/constants/radius";

type Props = {
  activities: ActivityFeedItem[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  limit?: number;
};

export const ActivityFeed = React.memo(function ActivityFeed({
  activities,
  loading,
  hasMore,
  onLoadMore,
  limit,
}: Props) {
  const displayList = limit ? activities.slice(0, limit) : activities;
  const isHighlight = (item: ActivityFeedItem) =>
    item.type === "challenge_completed" || item.type === "milestone";

  if (loading && activities.length === 0) {
    return (
      <View style={styles.skeleton}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.skeletonRow}>
            <View style={styles.skeletonIcon} />
            <View style={styles.skeletonBody} />
          </View>
        ))}
      </View>
    );
  }

  if (displayList.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🌱</Text>
        <Text style={styles.emptyTitle}>No activity yet</Text>
        <Text style={styles.emptySub}>
          Complete a mission to get things started!
        </Text>
      </View>
    );
  }

  if (limit && displayList.length > 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
        {displayList.map((item) => (
          <ActivityRow key={item._id} item={item} isHighlight={isHighlight(item)} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={displayList}
        keyExtractor={(item) => item._id}
        scrollEnabled={!limit}
        listHeaderComponent={
          <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
        }
        renderItem={({ item }) => (
          <ActivityRow item={item} isHighlight={isHighlight(item)} />
        )}
        ListFooterComponent={
          hasMore ? (
            <Pressable style={styles.loadMore} onPress={onLoadMore}>
              <Text style={styles.loadMoreText}>Load more ↓</Text>
            </Pressable>
          ) : null
        }
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  loadMore: {
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  loadMoreText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
  skeleton: {
    padding: SPACING.sm,
  },
  skeletonRow: {
    flexDirection: "row",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  skeletonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.border,
    marginRight: SPACING.sm,
  },
  skeletonBody: {
    flex: 1,
    height: 36,
    backgroundColor: COLORS.border,
    borderRadius: 8,
  },
  empty: {
    padding: SPACING.xl,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  emptySub: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});

