import React, { useState } from 'react';
import api from '../api';
import { useDispatch } from 'react-redux';
import { setToken } from '../store/slices/authSlice';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const nav = useNavigate();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      dispatch(setToken(data.token));
      localStorage.setItem('token', data.token);
      nav('/');
    } catch (err: any) {
      if (!err?.response) {
        setError('Cannot reach backend API. Ensure server is running on port 4000.');
      } else {
        setError(err?.response?.data?.message || 'Login failed. Check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-wrap">
      <div className="page-container max-w-5xl fade-up">
        <div className="surface grid overflow-hidden lg:grid-cols-[1.1fr_0.9fr]">
          <section className="p-6 sm:p-10 lg:p-12">
            <span className="pill">DevAI Pro</span>
            <h1 className="title-xl mt-4">Build GenAI apps without the usual setup friction.</h1>
            <p className="muted mt-4 max-w-xl text-sm sm:text-base">
              Ship prompts, workflows, and production-ready interfaces in one workspace built for
              fast teams.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="section-card">
                <h3 className="font-semibold">Project Workspaces</h3>
                <p className="muted mt-1 text-sm">Keep generated apps, prompts, and assets together.</p>
              </div>
              <div className="section-card">
                <h3 className="font-semibold">Premium Billing</h3>
                <p className="muted mt-1 text-sm">Upgrade and manage subscriptions from one panel.</p>
              </div>
            </div>
          </section>

          <section className="border-t border-[var(--stroke)] bg-white/55 p-6 sm:p-10 lg:border-l lg:border-t-0">
            <h2 className="title-lg">Sign in</h2>
            <p className="muted mt-2 text-sm">Continue to Chat Studio and your active projects.</p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Email</label>
                <input
                  className="text-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  type="email"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Password</label>
                <input
                  type="password"
                  className="text-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              ) : null}

              <button className="btn-primary w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <p className="muted mt-6 text-sm">
              New here?{' '}
              <Link to="/register" className="font-semibold text-[var(--primary-strong)]">
                Create an account
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
