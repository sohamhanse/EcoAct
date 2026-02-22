import React, { useRef, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Alert,
} from "react-native";
import ViewShot from "react-native-view-shot";
import { ShareCard, type SharePayload } from "./ShareCard";
import { captureAndShare, saveToCameraRoll } from "@/services/sharing.service";
import { COLORS } from "@/constants/colors";
import { RADIUS } from "@/constants/radius";
import { SPACING } from "@/constants/spacing";
import { TYPOGRAPHY } from "@/constants/typography";

const PREVIEW_SCALE = 0.5;

type Props = {
  visible: boolean;
  payload: SharePayload | null;
  onDismiss: () => void;
};

export function ShareBottomSheet({ visible, payload, onDismiss }: Props) {
  const viewShotRef = useRef<ViewShot>(null);

  const capture = useCallback(async (): Promise<string> => {
    if (!viewShotRef.current) throw new Error("ViewShot not ready");
    return viewShotRef.current.capture?.() ?? Promise.reject(new Error("Capture failed"));
  }, []);

  const handleShare = useCallback(
    async (dest: "instagram" | "twitter" | "whatsapp" | "general") => {
      if (!payload) return;
      try {
        await captureAndShare(capture, payload, dest);
        onDismiss();
      } catch (e) {
        Alert.alert("Share failed", String(e));
      }
    },
    [payload, capture, onDismiss]
  );

  const handleSave = useCallback(async () => {
    try {
      await saveToCameraRoll(capture);
      onDismiss();
    } catch (e) {
      Alert.alert("Save failed", String(e));
    }
  }, [capture, onDismiss]);

  if (!payload) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Share your impact</Text>

          <View style={[styles.previewWrap, { transform: [{ scale: PREVIEW_SCALE }] }]}>
            <ViewShot
              ref={viewShotRef}
              options={{ format: "png", quality: 1 }}
              style={styles.preview}
              collapsable={false}
            >
              <ShareCard {...payload} />
            </ViewShot>
          </View>

          <View style={styles.buttons}>
            <Pressable
              style={styles.shareBtn}
              onPress={() => handleShare("instagram")}
            >
              <Text style={styles.shareBtnLabel}>Instagram</Text>
            </Pressable>
            <Pressable
              style={styles.shareBtn}
              onPress={() => handleShare("twitter")}
            >
              <Text style={styles.shareBtnLabel}>X / Twitter</Text>
            </Pressable>
            <Pressable
              style={styles.shareBtn}
              onPress={() => handleShare("whatsapp")}
            >
              <Text style={styles.shareBtnLabel}>WhatsApp</Text>
            </Pressable>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnLabel}>Save to Camera Roll</Text>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={onDismiss}>
              <Text style={styles.cancelBtnLabel}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    paddingBottom: SPACING["3xl"],
  },
  title: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.textPrimary,
    textAlign: "center",
    marginBottom: SPACING.lg,
  },
  previewWrap: {
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  preview: {
    width: 360,
    height: 640,
    borderRadius: RADIUS.md,
    overflow: "hidden",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  shareBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  shareBtnLabel: {
    color: COLORS.primaryContrast,
    fontWeight: TYPOGRAPHY.weight.semibold,
    fontSize: TYPOGRAPHY.size.sm,
  },
  actions: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  saveBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: "center",
  },
  saveBtnLabel: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weight.semibold,
  },
  cancelBtn: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    justifyContent: "center",
  },
  cancelBtnLabel: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.size.base,
  },
});
