// Browser-side Supabase client. Safe to use from client components: it carries
// only the public anon key, and Row-Level Security keeps each family's data
// private. Never read the encrypted API key column through this client.

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
