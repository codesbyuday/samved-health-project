"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  AUTH_COOKIE_NAME,
  AUTH_SESSION_KEY,
  StaffProfile,
  SessionPayload,
  decodeSession,
  encodeSession,
} from "@/lib/auth";

interface AuthContextValue {
  profile: StaffProfile | null;
  session: SessionPayload | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuthState: (profile: StaffProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function writeSession(payload: SessionPayload) {
  const encodedSession = encodeSession(payload);
  localStorage.setItem(AUTH_SESSION_KEY, encodedSession);
  document.cookie = `${AUTH_COOKIE_NAME}=${encodedSession}; path=/; max-age=604800; samesite=lax`;
}

function clearStoredSession() {
  localStorage.removeItem(AUTH_SESSION_KEY);
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    clearStoredSession();
    setProfile(null);
    setSession(null);
  }, []);

  const setAuthState = useCallback((nextProfile: StaffProfile) => {
    const nextSession = {
      user_id: nextProfile.user_id,
      role: nextProfile.auth_role,
    };

    writeSession(nextSession);
    setProfile(nextProfile);
    setSession(nextSession);
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      const storedSession = localStorage.getItem(AUTH_SESSION_KEY);

      if (!storedSession) {
        setIsLoading(false);
        return;
      }

      const parsedSession = decodeSession(storedSession);

      if (!parsedSession) {
        clearStoredSession();
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: parsedSession.user_id,
            role: parsedSession.role,
            sessionRestore: true,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          clearStoredSession();
          setProfile(null);
          setSession(null);
          setIsLoading(false);
          return;
        }

        setAuthState(result.user as StaffProfile);
      } catch {
        clearStoredSession();
        setProfile(null);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    void restoreSession();
  }, [setAuthState]);

  const value = useMemo(
    () => ({
      profile,
      session,
      isAuthenticated: Boolean(profile && session),
      isLoading,
      setAuthState,
      logout,
    }),
    [isLoading, logout, profile, session, setAuthState]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
