import { User } from "../models/User.model.js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<boolean> {
  const user = await User.findById(userId).select("expoPushToken").lean();
  const token = user?.expoPushToken?.trim();
  if (!token) return false;

  const payload = {
    to: token,
    title,
    body,
    data: data ?? {},
    sound: "default",
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (process.env.EXPO_PUSH_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${process.env.EXPO_PUSH_ACCESS_TOKEN}`;
  }

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.error("Push send failed:", err);
    return false;
  }
}

export const PUC_NOTIFICATIONS = {
  expiry_30: (vehicleName: string) => ({
    title: "PUC Reminder - 30 Days",
    body: `${vehicleName}'s PUC expires in 30 days. Renew on time for +150 pts.`,
    data: { screen: "PUC", action: "log_puc" },
  }),
  expiry_15: (vehicleName: string) => ({
    title: "PUC Expiring Soon - 15 Days",
    body: `${vehicleName}'s PUC expires in 15 days. Keep your on-time streak going.`,
    data: { screen: "PUC", action: "log_puc" },
  }),
  expiry_7: (vehicleName: string) => ({
    title: "PUC Expiry - 7 Days Left",
    body: `${vehicleName} needs renewal in 7 days. Avoid a possible fine by renewing now.`,
    data: { screen: "PUC", action: "log_puc" },
  }),
  expiry_1: (vehicleName: string) => ({
    title: "PUC Expiry Tomorrow",
    body: `${vehicleName}'s PUC expires tomorrow. Renew now and keep your vehicle compliant.`,
    data: { screen: "PUC", action: "log_puc" },
  }),
  hotspot_alert: (locationName: string, count: number) => ({
    title: "Pollution Hotspot Nearby",
    body: `${count} pollution reports were filed near ${locationName} in the last 24 hours.`,
    data: { screen: "PUC", action: "view_map" },
  }),
} as const;

