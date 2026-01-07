import { supabase } from "@/integrations/supabase/client";

type SupabaseResult<T> = { data: T | null; error: any };

type SupabaseRequest<T> = () => PromiseLike<SupabaseResult<T>>;

function isJwtExpiredError(err: any): boolean {
  const msg = typeof err?.message === "string" ? err.message : "";
  return msg.toLowerCase().includes("jwt expired");
}

/**
 * Retry a backend request once after refreshing the session if we hit "JWT expired".
 */
export async function withJwtRefreshRetry<T>(
  request: SupabaseRequest<T>
): Promise<SupabaseResult<T>> {
  const first = await request();
  if (!first.error || !isJwtExpiredError(first.error)) return first;

  const { error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) return first;

  return await request();
}

/**
 * Ensures the session is valid before making requests.
 * Returns false if user must re-authenticate.
 */
export async function ensureValidSession(): Promise<boolean> {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) return false;
    if (!session) return false;

    const expiresAt = session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    const oneMinute = 60;

    if (expiresAt && expiresAt - now < oneMinute) {
      const { data: { session: refreshedSession }, error: refreshError } =
        await supabase.auth.refreshSession();

      if (refreshError) {
        const msg = refreshError.message || "";
        if (
          msg.includes("refresh_token_not_found") ||
          msg.includes("Invalid Refresh Token") ||
          msg.includes("invalid_grant")
        ) {
          await supabase.auth.signOut();
        }
        return false;
      }

      return !!refreshedSession;
    }

    return true;
  } catch {
    return false;
  }
}


