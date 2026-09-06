import { createClient } from "@/lib/supabase/client";

export async function signInWithGoogle(redirectPath = "/dashboard") {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
        redirectPath,
      )}`,
    },
  });

  if (error) {
    throw error;
  }
}
