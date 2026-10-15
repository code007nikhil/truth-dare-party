import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** Browser-only Supabase client. Call from effects/handlers, never during render on the server. */
export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase isn't configured. Copy .env.example to .env.local, fill in your project URL and key, then restart npm run dev."
    );
  }
  client = createClient(url, key, {
    // sessionStorage = one anonymous player per browser tab, so you can test with two tabs.
    auth: { storage: window.sessionStorage, persistSession: true, autoRefreshToken: true },
  });
  return client;
}
