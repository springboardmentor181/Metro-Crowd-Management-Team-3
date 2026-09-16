import api from "@/lib/axios";
import type { UserProfile } from "@/lib/api/types";

export async function getCurrentProfile(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>("/api/v1/auth/me");
  return data;
}

export async function updateProfile(
  userId: string,
  payload: Partial<Pick<UserProfile, "full_name" | "username" | "phone" | "avatar_url">>,
): Promise<UserProfile> {
  const { data } = await api.put<UserProfile>(`/api/v1/users/${userId}`, payload);
  return data;
}
