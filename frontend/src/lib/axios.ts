import axios from "axios";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { isAuthDisabled, getMockEmail } from "@/lib/auth/mock";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "",
  headers: {
    "Content-Type": "application/json",
  },
  
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  if (isAuthDisabled) {
    
    const email = getMockEmail();
    if (email) {
      config.headers.Authorization = `Bearer ${email}`;
    }
    return config;
  }

  if (isSupabaseConfigured) {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ERR_CANCELED") {
      
      return Promise.reject(error);
    }
    if (error.response) {
      
      const detail = error.response.data?.detail;
      const message =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(", ")
            : `Request failed (${error.response.status}).`;
      error.message = message || error.message;
    } else if (error.code === "ECONNABORTED") {
      error.message = "The request timed out. Please try again.";
    } else if (error.request) {
      
      error.message =
        "Couldn't reach the server. Check your connection or try again shortly.";
    }
    return Promise.reject(error);
  },
);

export default api;