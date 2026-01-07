import { supabase } from "@/integrations/supabase/client";

/**
 * Ensures the session is valid before making Supabase requests.
 * If the token is expired or about to expire, it will refresh the session.
 */
export async function ensureValidSession(): Promise<boolean> {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return false;
    }
    
    if (!session) {
      return false;
    }
    
    // Check if token is expired or about to expire (within 60 seconds)
    const expiresAt = session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    const oneMinute = 60;
    
    if (expiresAt && (expiresAt - now) < oneMinute) {
      // Token is expired or about to expire, refresh it
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('Failed to refresh session:', refreshError);
        // If refresh fails due to invalid token, sign out
        if (refreshError.message.includes('refresh_token_not_found') || 
            refreshError.message.includes('Invalid Refresh Token') ||
            refreshError.message.includes('JWT expired')) {
          await supabase.auth.signOut();
        }
        return false;
      }
      
      return !!refreshedSession;
    }
    
    return true;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
}

/**
 * Wraps a Supabase query function with automatic session refresh.
 * This ensures JWT tokens are always valid before making API calls.
 */
export async function withValidSession<T>(
  queryFn: () => Promise<{ data: T | null; error: Error | null }>
): Promise<{ data: T | null; error: Error | null }> {
  const isValid = await ensureValidSession();
  
  if (!isValid) {
    return {
      data: null,
      error: new Error('Session expired. Please log in again.')
    };
  }
  
  return queryFn();
}
