import { createClient } from "@supabase/supabase-js";

// Fall back to harmless placeholders so the client can always be constructed
// (e.g. during `next build`, before real env vars are configured). Requests
// made against the placeholder URL fail at runtime with a clear network
// error rather than crashing the build.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

// All data in v1 is public/editorial (no accounts, no per-user rows), so the
// anon key is safe to use for reads on both the server and the client. Row
// Level Security policies (see supabase/migrations) restrict writes.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
