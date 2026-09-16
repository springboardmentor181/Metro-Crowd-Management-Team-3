import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabasePublishableKey,
);

let browserClient: SupabaseClient | undefined;

export function createClient() {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Supabase is not configured. Add the Supabase URL and publishable key to .env.local, then restart the app.",
    );
  }

  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl, supabasePublishableKey);
  }

  return browserClient;
}