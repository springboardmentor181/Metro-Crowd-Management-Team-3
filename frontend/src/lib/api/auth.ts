import { createClient } from "@/lib/supabase/client";

interface ProfileRecord {
  role: string;
}

export async function getCurrentProfile() {
  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("No authenticated user found.");
  }

  const { data, error } = await supabase
    .from<ProfileRecord>("user_profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    throw error ?? new Error("Could not load user profile.");
  }

  return data;
}
