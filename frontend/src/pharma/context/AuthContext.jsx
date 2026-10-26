import React, { createContext, useEffect, useState, useContext } from 'react';
import { restoreSession, signIn, signOut, updateProviderProfile } from '../lib/database';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [pharmacyProfile, setPharmacyProfile] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    async function hydrateSession() {
      try {
        const restoredSession = await restoreSession();
        if (restoredSession) {
          setSession(restoredSession);
          setUser(restoredSession.user);
          setPharmacyProfile(restoredSession.profile);
        }
      } catch (error) {
        setAuthError(error.message);
      } finally {
        setAuthReady(true);
      }
    }

    hydrateSession();
  }, []);

  const login = async (email, password) => {
    try {
      const nextSession = await signIn(email, password);
      setSession(nextSession);
      setUser(nextSession.user);
      setPharmacyProfile(nextSession.profile);
      setAuthError('');
      return { success: true };
    } catch (error) {
      setAuthError(error.message);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await signOut();
    setSession(null);
    setUser(null);
    setPharmacyProfile(null);
  };

  const updateProfile = async (newData) => {
    if (!pharmacyProfile || !session) {
      return { success: false, error: 'Profile is not available yet.' };
    }

    try {
      const updatedProfile = await updateProviderProfile(pharmacyProfile.provider_id, newData, session);
      setPharmacyProfile(updatedProfile);
      setSession((prev) => (prev ? { ...prev, profile: updatedProfile } : prev));
      setAuthError('');
      return { success: true, profile: updatedProfile };
    } catch (error) {
      setAuthError(error.message);
      return { success: false, error: error.message };
    }
  };

  const refreshStatus = async () => {
    if (!pharmacyProfile?.provider_id) return null;
    try {
      const res = await fetch(`/api/pharmacy/documents?provider_id=${pharmacyProfile.provider_id}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const updatedProfile = {
            ...pharmacyProfile,
            ...(data.provider || {}),
            status: data.status || 'approved',
            documents: data.documents || [],
          };
          setPharmacyProfile(updatedProfile);
          setSession((prev) => (prev ? { ...prev, profile: updatedProfile } : prev));
          const storage = typeof window !== 'undefined' ? window.localStorage : null;
          if (storage && session) {
            storage.setItem('pharma-dashboard-session', JSON.stringify({ ...session, profile: updatedProfile }));
          }
          return data.status;
        }
      }
    } catch (err) {
      console.warn('refreshStatus error:', err);
    }
    return pharmacyProfile?.status || 'approved';
  };

  return (
    <AuthContext.Provider value={{ session, user, pharmacyProfile, authReady, authError, login, logout, updateProfile, refreshStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
