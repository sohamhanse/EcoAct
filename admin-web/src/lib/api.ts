import axios from "axios";
import type {
  AdminEvent,
  AdminQuiz,
  AdminUser,
  AuthTokens,
  OverviewResponse,
  PaginatedResponse,
  QuizAnalyticsResponse,
  TimeseriesResponse,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
const STORAGE_KEY = "ecoact_admin_auth";

type StoredAuth = {
  tokens: AuthTokens;
  user: AdminUser;
};

let accessToken: string | null = null;
let refreshToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export function readStoredAuth(): StoredAuth | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function persistAuth(tokens: AuthTokens, user: AdminUser) {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ tokens, user }));
}

export function clearAuthStorage() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem(STORAGE_KEY);
}

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

const boot = readStoredAuth();
if (boot) {
  accessToken = boot.tokens.accessToken;
  refreshToken = boot.tokens.refreshToken;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config as (typeof err.config & { _retry?: boolean }) | undefined;
    if (err.response?.status === 401 && refreshToken && original && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post<{ success: boolean; accessToken: string }>(
          `${API_BASE_URL}/api/auth/refresh`,
          { refreshToken },
        );
        accessToken = data.accessToken;
        if (original.headers) original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        clearAuthStorage();
        if (onUnauthorized) onUnauthorized();
      }
    }
    return Promise.reject(err);
  },
);

function unwrap<T>(payload: { success: boolean } & T): T {
  return payload as T;
}

export async function adminDemoLogin(input: { email?: string; name?: string; communityId?: string }) {
  const { data } = await api.post<{ success: boolean; accessToken: string; refreshToken: string; user: AdminUser }>(
    "/admin/auth/demo-login",
    input,
  );
  return { accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user };
}

export async function adminMe() {
  const { data } = await api.get<{ success: boolean; user: AdminUser }>("/admin/auth/me");
  return data.user;
}

export async function getOverview(communityId: string, params?: { from?: string; to?: string }) {
  const { data } = await api.get<{ success: boolean } & OverviewResponse>(
    `/admin/community/${communityId}/stats/overview`,
    { params },
  );
  return unwrap<OverviewResponse>(data);
}

export async function getTimeseries(
  communityId: string,
  params?: { from?: string; to?: string; granularity?: "daily" | "weekly" | "monthly" },
) {
  const { data } = await api.get<{ success: boolean } & TimeseriesResponse>(
    `/admin/community/${communityId}/stats/timeseries`,
    { params },
  );
  return unwrap<TimeseriesResponse>(data);
}

export async function listEvents(
  communityId: string,
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: "draft" | "published" | "archived";
    sortBy?: "createdAt" | "startAt" | "title";
    order?: "asc" | "desc";
  },
) {
  const { data } = await api.get<{ success: boolean } & PaginatedResponse<AdminEvent>>(
    `/admin/community/${communityId}/events`,
    { params },
  );
  return unwrap<PaginatedResponse<AdminEvent>>(data);
}

export async function createEvent(
  communityId: string,
  payload: {
    title: string;
    description: string;
    startAt: string;
    endAt: string;
    location?: string;
    coverImageUrl?: string;
    status?: "draft" | "published" | "archived";
    maxParticipants?: number | null;
  },
) {
  const { data } = await api.post<{ success: boolean; item: AdminEvent }>(
    `/admin/community/${communityId}/events`,
    payload,
  );
  return data.item;
}

export async function updateEvent(communityId: string, eventId: string, payload: Partial<AdminEvent>) {
  const { data } = await api.patch<{ success: boolean; item: AdminEvent }>(
    `/admin/community/${communityId}/events/${eventId}`,
    payload,
  );
  return data.item;
}

export async function publishEvent(communityId: string, eventId: string) {
  const { data } = await api.post<{ success: boolean; item: AdminEvent }>(
    `/admin/community/${communityId}/events/${eventId}/publish`,
  );
  return data.item;
}

export async function archiveEvent(communityId: string, eventId: string) {
  const { data } = await api.post<{ success: boolean; item: AdminEvent }>(
    `/admin/community/${communityId}/events/${eventId}/archive`,
  );
  return data.item;
}

export async function deleteEvent(communityId: string, eventId: string) {
  await api.delete(`/admin/community/${communityId}/events/${eventId}`);
}

export async function listQuizzes(
  communityId: string,
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: "draft" | "published" | "archived";
    sortBy?: "createdAt" | "publishedAt" | "title";
    order?: "asc" | "desc";
  },
) {
  const { data } = await api.get<{ success: boolean } & PaginatedResponse<AdminQuiz>>(
    `/admin/community/${communityId}/quizzes`,
    { params },
  );
  return unwrap<PaginatedResponse<AdminQuiz>>(data);
}

export async function createQuiz(
  communityId: string,
  payload: {
    title: string;
    description: string;
    status?: "draft" | "published" | "archived";
    startAt?: string | null;
    endAt?: string | null;
    timeLimitMinutes?: number | null;
    passingScore?: number;
    questions: Array<{ prompt: string; options: string[]; correctOptionIndex: number; explanation?: string }>;
  },
) {
  const { data } = await api.post<{ success: boolean; item: AdminQuiz }>(
    `/admin/community/${communityId}/quizzes`,
    payload,
  );
  return data.item;
}

export async function updateQuiz(communityId: string, quizId: string, payload: Partial<AdminQuiz>) {
  const { data } = await api.patch<{ success: boolean; item: AdminQuiz }>(
    `/admin/community/${communityId}/quizzes/${quizId}`,
    payload,
  );
  return data.item;
}

export async function publishQuiz(communityId: string, quizId: string) {
  const { data } = await api.post<{ success: boolean; item: AdminQuiz }>(
    `/admin/community/${communityId}/quizzes/${quizId}/publish`,
  );
  return data.item;
}

export async function archiveQuiz(communityId: string, quizId: string) {
  const { data } = await api.post<{ success: boolean; item: AdminQuiz }>(
    `/admin/community/${communityId}/quizzes/${quizId}/archive`,
  );
  return data.item;
}

export async function deleteQuiz(communityId: string, quizId: string) {
  await api.delete(`/admin/community/${communityId}/quizzes/${quizId}`);
}

export async function getQuizAnalytics(communityId: string, quizId: string) {
  const { data } = await api.get<{ success: boolean } & QuizAnalyticsResponse>(
    `/admin/community/${communityId}/quizzes/${quizId}/analytics`,
  );
  return unwrap<QuizAnalyticsResponse>(data);
}
