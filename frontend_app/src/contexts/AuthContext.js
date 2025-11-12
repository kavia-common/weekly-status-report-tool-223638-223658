/**
 * Authentication context (TEMP BYPASS MODE).
 *
 * TEMPORARY OVERRIDE: Bypass Supabase/auth checks and always treat the user as authenticated.
 * This is controlled by a feature flag REACT_APP_FEATURE_FLAGS including the token "AUTH_BYPASS"
 * or defaults to enabled if Supabase env is not configured.
 *
 * Behaviors:
 * - On startup, sets a default user profile and a mock session (no remote calls).
 * - loginWithPassword / sendMagicLink / signUp: immediately set default user.
 * - logout: clears local state to unauthenticated.
 *
 * SECURITY NOTE: This bypass is intended for local/demo use only. Do not enable in production.
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getSupabaseOrError } from '../supabaseClient';

const AuthContext = createContext(null);

// PUBLIC_INTERFACE
export const useAuth = () => useContext(AuthContext);

/**
 * Default mock user/session used when bypassing auth.
 */
const DEFAULT_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'demo.user@example.com',
  role: 'user',
  app_metadata: { provider: 'bypass', roles: ['user'] },
  user_metadata: { name: 'Demo User' },
};

const DEFAULT_SESSION = {
  access_token: 'bypass-access-token',
  token_type: 'bearer',
  expires_in: 3600 * 24 * 365,
  refresh_token: 'bypass-refresh-token',
  user: DEFAULT_USER,
};

// PUBLIC_INTERFACE
export const AuthProvider = ({ children }) => {
  const [{ client, error: supaError }] = useState(() => getSupabaseOrError());
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [envError] = useState(supaError);

  // Feature flag check: enable bypass if REACT_APP_FEATURE_FLAGS contains AUTH_BYPASS
  const flagsRaw = process.env.REACT_APP_FEATURE_FLAGS || '';
  const featureFlags = flagsRaw.split(',').map((f) => f.trim().toUpperCase()).filter(Boolean);
  const AUTH_BYPASS_ENABLED = featureFlags.includes('AUTH_BYPASS') || !client;

  useEffect(() => {
    let subscription;
    const init = async () => {
      if (AUTH_BYPASS_ENABLED) {
        // Bypass remote session discovery; immediately set default user
        setSession(DEFAULT_SESSION);
        setUser(DEFAULT_USER);
        setInitializing(false);
        return;
      }

      // Normal Supabase path (kept for completeness when bypass disabled)
      if (!client) {
        setInitializing(false);
        return;
      }
      const { data, error } = await client.auth.getSession();
      if (error) {
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
  }, [client, AUTH_BYPASS_ENABLED]);

  const value = useMemo(() => ({
    client,
    envError: AUTH_BYPASS_ENABLED ? null : envError,
    session,
    user,
    initializing,
    // PUBLIC_INTERFACE
    async loginWithPassword(email, _password) {
      // In bypass mode: ignore credentials, set default user and resolve
      if (AUTH_BYPASS_ENABLED) {
        const mockUser = { ...DEFAULT_USER, email: email || DEFAULT_USER.email };
        const mockSession = { ...DEFAULT_SESSION, user: mockUser };
        setUser(mockUser);
        setSession(mockSession);
        return { data: { user: mockUser, session: mockSession }, error: null };
      }
      if (!client) return { error: envError || 'Supabase is not configured' };
      return client.auth.signInWithPassword({ email, password: _password });
    },
    // PUBLIC_INTERFACE
    async sendMagicLink(email, options) {
      // In bypass mode: treat as instant "authenticated"
      if (AUTH_BYPASS_ENABLED) {
        const mockUser = { ...DEFAULT_USER, email: email || DEFAULT_USER.email };
        const mockSession = { ...DEFAULT_SESSION, user: mockUser };
        setUser(mockUser);
        setSession(mockSession);
        return { data: { user: mockUser, session: mockSession }, error: null };
      }
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
      // In bypass mode: treat as instant "authenticated"
      if (AUTH_BYPASS_ENABLED) {
        const mockUser = { ...DEFAULT_USER, email: email || DEFAULT_USER.email };
        const mockSession = { ...DEFAULT_SESSION, user: mockUser };
        setUser(mockUser);
        setSession(mockSession);
        return { data: { user: mockUser, session: mockSession }, error: null };
      }
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
      // Always clear local state. If bypassed, no remote call needed.
      setUser(null);
      setSession(null);
      if (!AUTH_BYPASS_ENABLED && client) {
        return client.auth.signOut();
      }
      return { data: { success: true }, error: null };
    },
  }), [client, envError, session, user, initializing, AUTH_BYPASS_ENABLED]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
