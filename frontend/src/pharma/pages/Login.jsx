import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { login, authReady, authError } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const cleanId = identifier.trim();
    const cleanPwd = password.trim();

    if (!cleanId || !cleanPwd) {
      setError('Please enter both your registered pharmacy email and password.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const result = await login(cleanId, cleanPwd);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      setError(err?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="w-full max-w-5xl overflow-hidden rounded-[2.25rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl grid lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left Information Branding Section */}
        <div className="p-8 md:p-12 lg:p-14 bg-gradient-to-br from-teal-50/50 via-slate-50 to-emerald-50/40 dark:from-slate-900 dark:via-slate-850 dark:to-teal-950/20 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-extrabold text-xl shadow-lg shadow-teal-500/25">
                PD
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                  Solapur Municipal Corporation
                </p>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">
                  Public Health Clinical Network
                </h2>
              </div>
            </div>

            <div className="mt-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-100/70 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800">
                <span className="h-2 w-2 rounded-full bg-teal-500 animate-pulse"></span>
                Multi-Tenant Pharmacy Platform
              </span>
              <h1 className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white leading-tight md:text-4xl">
                Integrated Pharmacy Management System
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Secure, isolated clinical & inventory portal for licensed city pharmacies in Solapur. 
                Each registered pharmacy accesses its own private dashboard with isolated stock valuation, 
                customer order records, sales billing, and live municipal disease alerts.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="mt-8 space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 text-xs font-bold">
                  ✓
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Tenant-Isolated Data Storage</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Your stock levels, batch numbers, pricing, and sales records are completely confidential.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 text-xs font-bold">
                  ✓
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Live Inventory & Billing</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Create customer orders with automatic inventory deduction and multi-product billing.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 text-xs font-bold">
                  ✓
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">SMC Public Health Coordination</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Receive ward-level disease surveillance notices and rare medicine shortage alerts.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            Compliant with Solapur Health Department Medical Facility Standards (2026).
          </div>
        </div>

        {/* Right Authentication Form Section */}
        <div className="p-8 md:p-12 flex flex-col justify-between bg-white dark:bg-slate-900">
          <div>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Pharmacy Sign In</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Enter your registered pharmacy credentials to access your dashboard.
                </p>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              >
                {theme === 'dark' ? (
                  <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Notice */}
              {(error || authError) && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/40 p-3.5 text-xs text-rose-700 dark:text-rose-300 leading-relaxed">
                  <svg className="h-4 w-4 shrink-0 text-rose-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error || authError}</span>
                </div>
              )}

              {/* Identifier Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Registered Pharmacy Email or Phone
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium"
                    placeholder="e.g. solapur.pharma1@gmail.com"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium"
                    placeholder="Enter your pharmacy password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!authReady || submitting}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md shadow-teal-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <span>Access Pharmacy Dashboard</span>
                )}
              </button>

              {/* Register New Pharmacy Action */}
              <div className="pt-3 pb-1 text-center border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  New pharmacy facility in Solapur?{' '}
                  <a
                    href="/register/pharmacy"
                    className="font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline transition-colors"
                  >
                    Register Pharmacy & Upload Documents →
                  </a>
                </p>
              </div>
            </form>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Restricted to verified pharmacy providers.
            </span>
            <a href="/" className="font-semibold text-teal-600 dark:text-teal-400 hover:underline">
              ← Main Portal
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
