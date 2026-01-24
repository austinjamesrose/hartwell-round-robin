/**
 * Environment variable validation utilities.
 * Validates required environment variables at startup with descriptive errors.
 */

interface EnvValidationResult {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
}

let validatedEnv: EnvValidationResult | null = null;

/**
 * Validates and returns required Supabase environment variables.
 * Throws a descriptive error if any required variable is missing.
 * Results are cached after first successful validation.
 */
export function getSupabaseEnv(): EnvValidationResult {
  if (validatedEnv) {
    return validatedEnv;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const missing: string[] = [];

  if (!url) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!anonKey) {
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. ` +
        `Please check your .env.local file or environment configuration.`
    );
  }

  validatedEnv = {
    NEXT_PUBLIC_SUPABASE_URL: url!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey!,
  };

  return validatedEnv;
}
