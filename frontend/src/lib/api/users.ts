import api from "@/lib/axios";
import type { UserProfile, UserRoleUpdate } from "@/lib/api/types";

export async function getUsers(signal?: AbortSignal): Promise<UserProfile[]> {
  const { data } = await api.get<UserProfile[]>("/api/v1/users/", { signal });
  return data;
}

export async function getUser(userId: string, signal?: AbortSignal): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>(`/api/v1/users/${userId}`, { signal });
  return data;
}

export async function updateUserRole(
  userId: string,
  payload: UserRoleUpdate,
): Promise<UserProfile> {
  const { data } = await api.put<UserProfile>(`/api/v1/users/${userId}`, payload);
  return data;
}
