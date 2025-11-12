/**
 * Authentication context using Supabase.
 * Handles session persistence, login via email/password or magic link, signup,
 * and logout. Exposes user, session, loading, and auth actions.
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getSupabaseOrError } from '../supabaseClient';

const AuthContext = createContext(null);

// PUBLIC_INTERFACE
export const useAuth = () => useContext(AuthContext);

// PUBLIC_INTERFACE
export const AuthProvider = ({ children }) => {
  const [{ client, error: supaError }] = useState(() => getSupabaseOrError());
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [envError, setEnvError] = useState(supaError);

  useEffect(() => {
    let subscription;
    const init = async () => {
      if (!client) {
        setInitializing(false);
        return;
      }
      const { data, error } = await client.auth.getSession();
      if (error) {
        // fail gracefully
        // eslint-disable-next-line no-console
        console.error('Error getting session', error);
      }
      const currentSession = data?.session ?? null;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      subscription = client.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
      }).data?.subscription;
      setInitializing(false);
    };
    init();
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [client]);

  const value = useMemo(() => ({
    client,
    envError,
    session,
    user,
    initializing,
    // PUBLIC_INTERFACE
    async loginWithPassword(email, password) {
      if (!client) return { error: envError || 'Supabase is not configured' };
      return client.auth.signInWithPassword({ email, password });
    },
    // PUBLIC_INTERFACE
    async sendMagicLink(email, options) {
      if (!client) return { error: envError || 'Supabase is not configured' };
      const siteUrl = process.env.REACT_APP_FRONTEND_URL || window.location.origin;
      const emailRedirectTo = options?.emailRedirectTo || `${siteUrl}`;
      return client.auth.signInWithOtp({
        email,
        options: { emailRedirectTo },
      });
    },
    // PUBLIC_INTERFACE
    async signUp(email, password) {
      if (!client) return { error: envError || 'Supabase is not configured' };
      const siteUrl = process.env.REACT_APP_FRONTEND_URL || window.location.origin;
      return client.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: siteUrl },
      });
    },
    // PUBLIC_INTERFACE
    async logout() {
      if (!client) return { error: envError || 'Supabase is not configured' };
      return client.auth.signOut();
    },
  }), [client, envError, session, user, initializing]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
