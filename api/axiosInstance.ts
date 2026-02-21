import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5000";

export const axiosInstance = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

const ACCESS_KEY = "ecotrack_access_token";
const REFRESH_KEY = "ecotrack_refresh_token";

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(ACCESS_KEY);
}

export async function setTokens(access: string, refresh: string): Promise<void> {
  await AsyncStorage.setItem(ACCESS_KEY, access);
  await AsyncStorage.setItem(REFRESH_KEY, refresh);
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
}

axiosInstance.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosInstance.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (err: AxiosError<{ message?: string; code?: string }>) => {
    const original = err.config;
    if (err.response?.status === 401 && original && !(original as { _retry?: boolean })._retry) {
      (original as { _retry?: boolean })._retry = true;
      const refresh = await AsyncStorage.getItem(REFRESH_KEY);
      if (refresh) {
        try {
          const { data } = await axios.post<{ success?: boolean; accessToken?: string }>(
            `${API_BASE}/api/auth/refresh`,
            { refreshToken: refresh },
          );
          if (data.success && data.accessToken) {
            await AsyncStorage.setItem(ACCESS_KEY, data.accessToken);
            if (original.headers) original.headers.Authorization = `Bearer ${data.accessToken}`;
            return axiosInstance(original);
          }
        } catch (_e) {
          await clearTokens();
        }
      }
    }
    return Promise.reject(err);
  },
);
