// Server-side Supabase client, bound to the request cookies. Used in Route
// Handlers and Server Components to identify the logged-in parent and to read
// the encrypted settings row. The setAll try/catch covers the case where this
// runs in a Server Component (cookies are read-only there; the middleware
// refreshes them instead).

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component; safe to ignore.
          }
        },
      },
    },
  );
}
