import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../services/supabaseClient";

export interface AuthSessionState {
  session: Session | null;
  user: Session["user"] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export function useAuthSession(): AuthSessionState {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!active) return;
        setSession(session);
        setIsLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setSession(null);
        setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setSession(session);
      setIsLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    user: session?.user ?? null,
    isAuthenticated: Boolean(session),
    isLoading,
  };
}
