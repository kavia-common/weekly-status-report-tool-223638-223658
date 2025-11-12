/**
 * Login page with email/password and magic link options.
 * In AUTH_BYPASS mode: any input will authenticate a default user and navigate to dashboard.
 */
// PUBLIC_INTERFACE
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { Alert } from '../components/UI/Alert';

export default function Login() {
  const { loginWithPassword, sendMagicLink, envError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('password'); // 'password' | 'magic'
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  const validateEmail = (val) => /\S+@\S+\.\S+/.test(val);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (!validateEmail(email)) {
      setErr('Please enter a valid email.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'password') {
        if (password.length < 6) {
          // In bypass mode this will still succeed; keep UI hint consistent
          // but do not block submit hard to allow bypass login flows.
        }
        const { error } = await loginWithPassword(email, password);
        if (error) setErr(error.message || String(error));
        // On success, ProtectedRoute will render dashboard based on user presence
      } else {
        const { error } = await sendMagicLink(email);
        if (error) setErr(error.message || String(error));
        else setMsg('If AUTH_BYPASS is enabled, you are already signed in.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 440 }}>
      <div className="card">
        <h2 style={{ marginTop: 0, marginBottom: 6 }}>Sign in</h2>
        <div className="help" style={{ marginBottom: 12 }}>
          Use your company email to sign in. For demos, AUTH_BYPASS signs you in as a default user.
        </div>
        {envError && <Alert kind="error">{envError}</Alert>}
        {msg && <Alert kind="success">{msg}</Alert>}
        {err && <Alert kind="error">{err}</Alert>}
        <form onSubmit={onSubmit}>
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
          {mode === 'password' && (
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          )}
          <div className="row" style={{ alignItems: 'center' }}>
            <Button type="submit" disabled={loading}>{loading ? 'Please wait…' : 'Continue'}</Button>
            <Button type="button" variant="secondary" onClick={() => setMode(mode === 'password' ? 'magic' : 'password')}>
              {mode === 'password' ? 'Use magic link' : 'Use password'}
            </Button>
          </div>
        </form>
        <div className="help" style={{ marginTop: 12 }}>
          Temporary: Set REACT_APP_FEATURE_FLAGS=AUTH_BYPASS to enable local/demo sign-in without Supabase.
        </div>
      </div>
    </div>
  );
}
