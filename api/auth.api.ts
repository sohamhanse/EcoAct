import { axiosInstance, setTokens, clearTokens } from "./axiosInstance";
import type { ApiUser } from "@/src/types";

export interface GoogleAuthResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  user: ApiUser;
}

export async function googleAuth(idToken: string): Promise<GoogleAuthResponse> {
  const { data } = await axiosInstance.post<GoogleAuthResponse>("/auth/google", { idToken });
  if (data.success && data.accessToken && data.refreshToken) {
    await setTokens(data.accessToken, data.refreshToken);
  }
  return data;
}

export async function refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
  const { data } = await axiosInstance.post<{ success: boolean; accessToken: string }>("/auth/refresh", {
    refreshToken,
  });
  return { accessToken: data.accessToken };
}

export async function logout(): Promise<void> {
  try {
    await axiosInstance.post("/auth/logout");
  } finally {
    await clearTokens();
  }
}

export async function getMe(): Promise<ApiUser> {
  const { data } = await axiosInstance.get<{ success: boolean; user: ApiUser }>("/auth/me");
  return data.user;
}
