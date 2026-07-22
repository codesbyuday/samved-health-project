import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
  const [email, setEmail] = useState('pharmacy@health.gov');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const { login, authReady, authError } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="surface-panel grid w-full max-w-5xl overflow-hidden rounded-[2rem] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="p-8 md:p-12">
          <div className="brand-mark mb-6 flex h-16 w-16 items-center justify-center rounded-3xl text-2xl font-bold">
            PD
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-soft">Pharmacy command center</p>
          <h1 className="mt-4 text-4xl font-bold leading-tight text-main">
            Bring inventory, prescriptions, alerts, and orders into one clinical workspace.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-soft">
            This build now supports branded light and dark themes, centralized data loading, and a Supabase-ready
            database connection path.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="surface-card rounded-3xl p-4">
              <p className="text-sm font-semibold text-main">Live-ready data</p>
              <p className="mt-2 text-sm text-soft">All major screens now read through one shared adapter.</p>
            </div>
            <div className="surface-card rounded-3xl p-4">
              <p className="text-sm font-semibold text-main">Theme toggle</p>
              <p className="mt-2 text-sm text-soft">Switch between calm day mode and focused night mode.</p>
            </div>
            <div className="surface-card rounded-3xl p-4">
              <p className="text-sm font-semibold text-main">Safer rollout</p>
              <p className="mt-2 text-sm text-soft">Mock fallback stays available until your real env values are added.</p>
            </div>
          </div>
        </div>

        <div className="surface-card m-4 rounded-[1.75rem] p-8 md:p-10">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-main">Sign in</h2>
              <p className="mt-1 text-sm text-soft">Use your pharmacy account to continue.</p>
            </div>
            <button type="button" className="theme-switch" onClick={toggleTheme} aria-label="Toggle color theme">
              <span />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-soft">Email Address</label>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="input-shell" required />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-soft">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="input-shell"
                required
              />
            </div>

            {(error || authError) && <p className="text-sm text-red-500">{error || authError}</p>}

            <button type="submit" className="btn-primary w-full" disabled={!authReady}>
              {authReady ? 'Access Dashboard' : 'Preparing session...'}
            </button>
          </form>

          <div className="mt-6 surface-muted rounded-3xl p-4 text-sm text-soft">
            Theme: <span className="font-semibold text-main">{theme === 'dark' ? 'Night mode' : 'Day mode'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
