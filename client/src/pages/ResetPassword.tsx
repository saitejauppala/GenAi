import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';

export default function ResetPassword() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromQuery = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [token, setToken] = useState(tokenFromQuery);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token.trim()) {
      setError('Reset token is required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/reset-password', {
        token: token.trim(),
        password
      });
      setMessage(data?.message || 'Password reset successful. Redirecting to login...');
      setTimeout(() => nav('/login'), 1200);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-wrap">
      <div className="page-container max-w-xl fade-up">
        <section className="surface p-6 sm:p-8">
          <span className="pill">Account Recovery</span>
          <h1 className="title-lg mt-4">Reset password</h1>
          <p className="muted mt-2 text-sm">Set a new password for your account.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Reset token</label>
              <input
                className="text-input"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste your reset token"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">New password</label>
              <input
                type="password"
                className="text-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Confirm password</label>
              <input
                type="password"
                className="text-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
              />
            </div>

            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            {message ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {message}
              </p>
            ) : null}

            <button className="btn-primary w-full" disabled={loading}>
              {loading ? 'Resetting password...' : 'Reset password'}
            </button>
          </form>

          <p className="muted mt-6 text-sm">
            Back to{' '}
            <Link to="/login" className="font-semibold text-[var(--primary-strong)]">
              login
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
