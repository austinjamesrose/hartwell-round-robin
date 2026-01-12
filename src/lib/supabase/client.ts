import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

// Creates a Supabase client for use in browser/client components
// This uses the @supabase/ssr package for proper cookie handling in Next.js
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
