/// PUBLIC_INTERFACE
/**
 * Minimal Supabase client setup for the Weekly Status Report app.
 * Reads REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY from process.env.
 * Provides graceful handling when variables are missing by exposing a null client
 * and an informative error message through getSupabaseOrError().
 */

import { createClient } from '@supabase/supabase-js';

// PUBLIC_INTERFACE
export const getSupabaseOrError = () => {
  const url = process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.REACT_APP_SUPABASE_KEY;

  if (!url || !key) {
    const missing = [];
    if (!url) missing.push('REACT_APP_SUPABASE_URL');
    if (!key) missing.push('REACT_APP_SUPABASE_KEY');
    return {
      client: null,
      error: `Missing required environment variables: ${missing.join(', ')}. Please set them in your .env file.`,
    };
  }

  const client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return { client, error: null };
};
