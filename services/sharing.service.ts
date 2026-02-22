import { Alert, Linking, Platform } from "react-native";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import type { SharePayload } from "@/components/sharing/ShareCard";

export type ShareDestination = "instagram" | "twitter" | "whatsapp" | "general";

function buildTwitterCaption(payload: SharePayload): string {
  switch (payload.type) {
    case "badge":
      return `Just earned the ${payload.data.badgeName} badge on @EcoTrackApp 🏅 ${payload.data.co2Saved}kg CO₂ saved so far. Small actions, real impact. #EcoTrack #ClimateAction #Sustainability`;
    case "challenge":
      return `My community saved ${payload.data.co2Kg}kg CO₂ in ${payload.data.days} days on @EcoTrackApp 🌍 ${payload.data.memberCount} of us made it happen. #EcoTrack #CommunityAction`;
    case "footprint":
      return `Reduced my carbon footprint by ${payload.data.improvementPercent}% this month on @EcoTrackApp 🌱 From ${payload.data.from}kg → ${payload.data.to}kg CO₂/year. #EcoTrack #CarbonFootprint`;
  }
}

function buildWhatsAppCaption(payload: SharePayload): string {
  switch (payload.type) {
    case "badge":
      return `I just earned the "${payload.data.badgeName}" badge on EcoTrack! 🏅 I've saved ${payload.data.co2Saved}kg CO₂. You should try it too 🌿`;
    case "challenge":
      return `My community just hit a huge goal on EcoTrack — ${payload.data.co2Kg}kg CO₂ saved together! 🌍 Join us 🌿`;
    case "footprint":
      return `I cut my carbon footprint by ${payload.data.improvementPercent}% this month using EcoTrack 🌱 Check it out!`;
  }
}

function buildGeneralCaption(payload: SharePayload): string {
  switch (payload.type) {
    case "badge":
      return `I just earned the ${payload.data.badgeName} badge on EcoTrack! 🏅`;
    case "challenge":
      return `My community saved ${payload.data.co2Kg}kg CO₂ on EcoTrack! 🌍`;
    case "footprint":
      return `I reduced my carbon footprint by ${payload.data.improvementPercent}% on EcoTrack 🌱`;
  }
}

export async function captureAndShare(
  captureAsync: () => Promise<string>,
  payload: SharePayload,
  destination: ShareDestination
): Promise<void> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== "granted") {
    Alert.alert("Permission needed", "Please allow photo library access to share.");
    return;
  }

  const uri = await captureAsync();
  if (!uri) throw new Error("Failed to capture image");

  if (destination === "instagram") {
    try {
      const instagramUrl = `instagram-stories://share?backgroundImage=${encodeURIComponent(uri)}`;
      const canOpen = await Linking.canOpenURL(instagramUrl);
      if (canOpen) {
        await Linking.openURL(instagramUrl);
      } else {
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert(
          "Saved to Gallery",
          "Open Instagram and share from your camera roll."
        );
      }
    } catch {
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert(
        "Saved to Gallery",
        "Open Instagram and share from your camera roll."
      );
    }
    return;
  }

  const captions: Record<ShareDestination, string> = {
    instagram: "",
    twitter: buildTwitterCaption(payload),
    whatsapp: buildWhatsAppCaption(payload),
    general: buildGeneralCaption(payload),
  };

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: "image/png",
      dialogTitle:
        destination === "whatsapp"
          ? "Share to WhatsApp"
          : destination === "twitter"
            ? "Share to X/Twitter"
            : "Share",
    });
  } else {
    await MediaLibrary.saveToLibraryAsync(uri);
    Alert.alert("Saved", "Image saved to your gallery.");
  }
}

export async function saveToCameraRoll(captureAsync: () => Promise<string>): Promise<void> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== "granted") {
    Alert.alert("Permission needed", "Please allow photo library access.");
    return;
  }
  const uri = await captureAsync();
  if (uri) {
    await MediaLibrary.saveToLibraryAsync(uri);
    Alert.alert("Saved", "Image saved to your gallery.");
  }
}
