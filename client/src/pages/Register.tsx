import React, { useState } from 'react';
import api from '../api';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const nav = useNavigate();

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/api/auth/register', { email, password });
      nav('/login');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-wrap">
      <div className="page-container max-w-5xl fade-up">
        <div className="surface grid overflow-hidden lg:grid-cols-[0.95fr_1.05fr]">
          <section className="border-b border-[var(--stroke)] bg-white/55 p-6 sm:p-10 lg:border-b-0 lg:border-r lg:p-12">
            <span className="pill">Create Workspace</span>
            <h1 className="title-xl mt-4">Launch your first GenAI product in minutes.</h1>
            <p className="muted mt-4 text-sm sm:text-base">
              Start with a clean project space and scale into premium workflows when your product
              is ready.
            </p>
            <div className="mt-7 space-y-3">
              <div className="section-card">
                <h3 className="font-semibold">Simple onboarding</h3>
                <p className="muted mt-1 text-sm">Create an account and start directly in Chat Studio.</p>
              </div>
              <div className="section-card">
                <h3 className="font-semibold">Built for iteration</h3>
                <p className="muted mt-1 text-sm">Move from prototypes to production-ready projects faster.</p>
              </div>
            </div>
          </section>

          <section className="p-6 sm:p-10">
            <h2 className="title-lg">Register</h2>
            <p className="muted mt-2 text-sm">Create your account to access the DevAI workspace.</p>

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
                  placeholder="Create a strong password"
                  required
                />
              </div>

              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              ) : null}

              <button className="btn-primary w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <p className="muted mt-6 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-[var(--primary-strong)]">
                Sign in
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
