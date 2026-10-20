// Server-only Supabase Storage settings — never import from client components.

export interface SupabaseStorageConfig {
  url: string;
  key: string;
  bucket: string;
}

/**
 * SUPABASE_SECRET_KEY (sb_secret_…) is preferred; SUPABASE_SERVICE_ROLE_KEY is the
 * legacy JWT, which Supabase is retiring at the end of 2026.
 */
export function supabaseStorageConfig(): SupabaseStorageConfig | null {
  const url = (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ""
  ).trim().replace(/\/$/, "");
  const key = (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  ).trim();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "signage-media";
  return url && key ? { url, key, bucket } : null;
}

/** sb_secret_ keys aren't JWTs, so they go in `apikey` only; legacy JWTs also need Bearer. */
export function supabaseAuthHeaders(key: string): Record<string, string> {
  return key.startsWith("sb_")
    ? { apikey: key }
    : { apikey: key, Authorization: `Bearer ${key}` };
}
