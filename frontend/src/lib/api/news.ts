import api from "@/lib/axios";
import type { NewsCreate, NewsItem, NewsUpdate } from "@/lib/api/types";

export async function getNews(
  includeInactive = false,
  signal?: AbortSignal,
): Promise<NewsItem[]> {
  const { data } = await api.get<NewsItem[]>("/api/v1/news/", {
    params: includeInactive ? { include_inactive: true } : {},
    signal,
  });
  return data;
}

export async function createNews(payload: NewsCreate): Promise<NewsItem> {
  const { data } = await api.post<NewsItem>("/api/v1/news/", payload);
  return data;
}

export async function updateNews(
  newsId: number,
  payload: NewsUpdate,
): Promise<NewsItem> {
  const { data } = await api.patch<NewsItem>(`/api/v1/news/${newsId}`, payload);
  return data;
}

export async function deleteNews(newsId: number): Promise<void> {
  await api.delete(`/api/v1/news/${newsId}`);
}
