/**
 * Topbar displaying brand and user actions.
 */
// PUBLIC_INTERFACE
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../UI/Button';

export function Topbar() {
  const { user, logout, envError } = useAuth();
  return (
    <header className="topbar">
      <div className="brand">
        <span>DigitalT3</span>
        <span className="subtitle">Weekly Status</span>
      </div>
      <div>
        {envError && <span style={{ color: '#DC2626', marginRight: 12 }} title={envError}>Config Error</span>}
        {user ? (
          <>
            <span style={{ marginRight: 10, color: '#6B7280', fontSize: 14 }}>{user.email}</span>
            <Button variant="secondary" onClick={logout}>Logout</Button>
          </>
        ) : null}
      </div>
    </header>
  );
}
