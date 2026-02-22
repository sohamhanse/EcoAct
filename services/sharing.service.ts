import type { SharePayload } from "@/components/sharing/ShareCard";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { Alert, Linking } from "react-native";

export type ShareDestination = "instagram" | "twitter" | "whatsapp" | "general";

function buildTwitterCaption(payload: SharePayload): string {
  switch (payload.type) {
    case "badge":
      return `Just earned the ${payload.data.badgeName} badge on @EcoActApp 🏅 ${payload.data.co2Saved}kg CO₂ saved so far. Small actions, real impact. #EcoAct #ClimateAction #Sustainability`;
    case "challenge":
      return `My community saved ${payload.data.co2Kg}kg CO₂ in ${payload.data.days} days on @EcoActApp 🌍 ${payload.data.memberCount} of us made it happen. #EcoAct #CommunityAction`;
    case "footprint":
      return `Reduced my carbon footprint by ${payload.data.improvementPercent}% this month on @EcoActApp 🌱 From ${payload.data.from}kg → ${payload.data.to}kg CO₂/year. #EcoAct #CarbonFootprint`;
    case "puc":
      return `Logged PUC compliance for ${payload.data.vehicleName} on @EcoActApp. +${payload.data.pointsAwarded} pts and cleaner air impact of ~${payload.data.co2ImpactKg}kg CO₂e/year. #EcoAct #PUC`;
  }
}

function buildWhatsAppCaption(payload: SharePayload): string {
  switch (payload.type) {
    case "badge":
      return `I just earned the "${payload.data.badgeName}" badge on EcoAct! 🏅 I've saved ${payload.data.co2Saved}kg CO₂. You should try it too 🌿`;
    case "challenge":
      return `My community just hit a huge goal on EcoAct — ${payload.data.co2Kg}kg CO₂ saved together! 🌍 Join us 🌿`;
    case "footprint":
      return `I cut my carbon footprint by ${payload.data.improvementPercent}% this month using EcoAct 🌱 Check it out!`;
    case "puc":
      return `I kept my vehicle (${payload.data.vehicleName}) PUC-compliant on EcoAct and earned +${payload.data.pointsAwarded} pts 🌿`;
  }
}

function buildGeneralCaption(payload: SharePayload): string {
  switch (payload.type) {
    case "badge":
      return `I just earned the ${payload.data.badgeName} badge on EcoAct! 🏅`;
    case "challenge":
      return `My community saved ${payload.data.co2Kg}kg CO₂ on EcoAct! 🌍`;
    case "footprint":
      return `I reduced my carbon footprint by ${payload.data.improvementPercent}% on EcoAct 🌱`;
    case "puc":
      return `I logged PUC compliance for ${payload.data.vehicleName} on EcoAct 🌿`;
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
