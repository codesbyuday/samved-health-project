"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  AUTH_COOKIE_NAME,
  USER_SESSION_KEY,
  AuthenticatedUser,
  UserProfile,
  SessionPayload,
  decodeSession,
  encodeSession,
} from "@/lib/auth";

interface AuthContextValue {
  user: UserProfile | null;
  session: SessionPayload | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuthState: (user: AuthenticatedUser) => void;
  updateUser: (user: AuthenticatedUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function writeSession(payload: SessionPayload) {
  const encodedSession = encodeSession(payload);
  document.cookie = `${AUTH_COOKIE_NAME}=${encodedSession}; path=/; max-age=604800; samesite=lax`;
}

function writeUserSession(user: UserProfile) {
  localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
}

function clearStoredSession() {
  localStorage.removeItem(USER_SESSION_KEY);
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    clearStoredSession();
    setUser(null);
    setSession(null);
  }, []);

  const updateUser = useCallback((nextUser: AuthenticatedUser) => {
    const nextSession = {
      user_id: nextUser.user_id,
      role: nextUser.access_role,
    };

    writeSession(nextSession);
    writeUserSession({
      user_id: nextUser.user_id,
      name: nextUser.name,
      email: nextUser.email,
      role: nextUser.role,
      hospital_id: nextUser.hospital_id,
      hospital_name: nextUser.hospital_name,
      staff_uuid: nextUser.staff_uuid,
      staff_id: nextUser.staff_id,
      designation: nextUser.designation,
      department: nextUser.department,
      phone: nextUser.phone,
      address: nextUser.address,
      joined_at: nextUser.joined_at,
    });
    setUser({
      user_id: nextUser.user_id,
      name: nextUser.name,
      email: nextUser.email,
      role: nextUser.role,
      hospital_id: nextUser.hospital_id,
      hospital_name: nextUser.hospital_name,
      staff_uuid: nextUser.staff_uuid,
      staff_id: nextUser.staff_id,
      designation: nextUser.designation,
      department: nextUser.department,
      phone: nextUser.phone,
      address: nextUser.address,
      joined_at: nextUser.joined_at,
    });
    setSession(nextSession);
  }, []);

  const setAuthState = useCallback(
    (nextUser: AuthenticatedUser) => {
      updateUser(nextUser);
    },
    [updateUser]
  );

  useEffect(() => {
    const restoreSession = async () => {
      const storedUser = localStorage.getItem(USER_SESSION_KEY);

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser) as UserProfile;
          setUser(parsedUser);
        } catch {
          localStorage.removeItem(USER_SESSION_KEY);
        }
      }

      const cookieMatch = document.cookie
        .split("; ")
        .find((item) => item.startsWith(`${AUTH_COOKIE_NAME}=`))
        ?.split("=")[1];
      const parsedSession = cookieMatch ? decodeSession(cookieMatch) : null;

      if (!parsedSession) {
        clearStoredSession();
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/profile");

        const result = await response.json();

        if (!response.ok || !result.success) {
          clearStoredSession();
          setUser(null);
          setSession(null);
          setIsLoading(false);
          return;
        }

        setAuthState(result.user as AuthenticatedUser);
      } catch {
        clearStoredSession();
        setUser(null);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    void restoreSession();
  }, [setAuthState]);

  const value = useMemo(
    () => ({
      user,
      session,
      isAuthenticated: Boolean(user && session),
      isLoading,
      setAuthState,
      updateUser,
      logout,
    }),
    [isLoading, logout, session, setAuthState, updateUser, user]
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
