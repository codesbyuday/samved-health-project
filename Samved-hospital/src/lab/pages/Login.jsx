import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { useTheme } from '../context/ThemeContext';

const Login = ({ onLogin }) => {
  const { providers, selectProvider, currentProvider } = useAppData();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('AaSsDd123@');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email === 'test@example.com' && password === 'AaSsDd123@') {
      setError('');
      onLogin();
    } else {
      setError('Invalid credentials. Please use test@example.com / AaSsDd123@');
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card max-w-lg">
        <div className="section-header">
          <div>
            <p className="eyebrow">SAMVED Access</p>
            <h1 className="section-title">Diagnostic Lab Operations</h1>
            <p className="section-copy">Enter your lab credentials to access bookings, sample collections, and test reports.</p>
          </div>
          <button type="button" onClick={toggleTheme} className="toggle-button" aria-label="Toggle theme">
            <span className="toggle-icon toggle-icon-left" aria-hidden="true">
              <i className="fa-solid fa-sun"></i>
            </span>
            <span className="toggle-icon toggle-icon-right" aria-hidden="true">
              <i className="fa-solid fa-moon"></i>
            </span>
            <span className={`toggle-thumb ${theme === 'dark' ? 'translate-x-7' : 'translate-x-0'}`}>
              <i className={`fa-solid ${theme === 'dark' ? 'fa-moon' : 'fa-sun'}`}></i>
            </span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-stack mt-6 space-y-4">
          <label className="field">
            <span>Email Address</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          <label className="field">
            <span>Lab Workspace</span>
            <select
              value={currentProvider?.provider_id || ''}
              onChange={(e) => selectProvider(e.target.value)}
            >
              {providers.map((provider) => (
                <option key={provider.provider_id} value={provider.provider_id}>
                  {provider.name} ({provider.provider_id})
                </option>
              ))}
            </select>
          </label>

          {error && (
            <p className="text-sm font-medium text-red-500">{error}</p>
          )}

          <button type="submit" className="btn-primary justify-center">
            <i className="fa-solid fa-right-to-bracket"></i>
            <span>Enter Lab Dashboard</span>
          </button>
        </form>

        <div className="mt-4 rounded-2xl bg-purple-500/10 p-4 text-xs leading-relaxed text-purple-700 dark:text-purple-300">
          <span className="font-semibold uppercase tracking-wider">Demo Credentials Pre-filled</span>
          <div className="mt-1 font-mono">
            Email: test@example.com<br />
            Password: AaSsDd123@
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
