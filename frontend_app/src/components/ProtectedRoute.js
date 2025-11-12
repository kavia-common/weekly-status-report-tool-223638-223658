/**
 * Simple protected route wrapper that redirects to /login when unauthenticated.
 * In AUTH_BYPASS mode, initializing resolves immediately with a default user.
 */
// PUBLIC_INTERFACE
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute() {
  const { user, initializing } = useAuth();
  if (initializing) {
    return <div className="container"><div className="card">Loading authentication…</div></div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
