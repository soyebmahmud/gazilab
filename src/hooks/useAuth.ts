import { useState, useEffect, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to refresh the session
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Session refresh error:', error);
        // If refresh fails, sign out
        if (error.message.includes('refresh_token_not_found') || error.message.includes('Invalid Refresh Token')) {
          await supabase.auth.signOut();
        }
        return null;
      }
      return refreshedSession;
    } catch (error) {
      console.error('Failed to refresh session:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Handle token refresh events
        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        }
        
        // Handle sign out
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        // Check if token is about to expire (within 5 minutes)
        const expiresAt = session.expires_at;
        const now = Math.floor(Date.now() / 1000);
        const fiveMinutes = 5 * 60;
        
        if (expiresAt && (expiresAt - now) < fiveMinutes) {
          // Token is about to expire, refresh it
          const refreshedSession = await refreshSession();
          setSession(refreshedSession);
          setUser(refreshedSession?.user ?? null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } else {
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [refreshSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }, []);

  // Sign up is disabled for this private ERP system
  // Users must be pre-created by administrators in Supabase Auth
  const signUp = useCallback(async (_email: string, _password: string) => {
    return { 
      error: { 
        message: "Sign up is disabled. This is a private system. Contact your administrator for access." 
      } as { message: string }
    };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshSession,
    isAuthenticated: !!session,
  };
}
