import api from "@/lib/axios";
import type {
  Enquiry,
  EnquiryCreate,
  EnquiryResolvePayload,
  EnquiryStats,
  EnquiryStatus,
} from "@/lib/api/types";

export async function getEnquiries(
  status?: EnquiryStatus,
  signal?: AbortSignal,
): Promise<Enquiry[]> {
  const { data } = await api.get<Enquiry[]>("/api/v1/enquiries/", {
    params: status ? { status } : {},
    signal,
  });
  return data;
}

export async function createEnquiry(payload: EnquiryCreate): Promise<Enquiry> {
  const { data } = await api.post<Enquiry>("/api/v1/enquiries/", payload);
  return data;
}

export async function getEnquiry(enquiryId: number): Promise<Enquiry> {
  const { data } = await api.get<Enquiry>(`/api/v1/enquiries/${enquiryId}`);
  return data;
}

export async function resolveEnquiry(
  enquiryId: number,
  payload: EnquiryResolvePayload,
): Promise<Enquiry> {
  const { data } = await api.patch<Enquiry>(
    `/api/v1/enquiries/${enquiryId}/resolve`,
    payload,
  );
  return data;
}

export async function getEnquiryStats(signal?: AbortSignal): Promise<EnquiryStats> {
  const { data } = await api.get<EnquiryStats>(
    "/api/v1/enquiries/stats/summary",
    { signal },
  );
  return data;
}