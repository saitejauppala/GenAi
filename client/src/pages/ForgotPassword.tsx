import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resetUrl, setResetUrl] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setResetUrl('');

    try {
      const { data } = await api.post('/api/auth/forgot-password', { email });
      setMessage(data?.message || 'If this email is registered, a reset link has been generated.');
      if (data?.resetUrl) setResetUrl(data.resetUrl);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Unable to process request right now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-wrap">
      <div className="page-container max-w-xl fade-up">
        <section className="surface p-6 sm:p-8">
          <span className="pill">Account Recovery</span>
          <h1 className="title-lg mt-4">Forgot password</h1>
          <p className="muted mt-2 text-sm">Enter your email to generate a reset link.</p>

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

            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            {message ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                <p>{message}</p>
                {resetUrl ? (
                  <p className="mt-2 break-all">
                    Reset link: <a className="underline" href={resetUrl}>{resetUrl}</a>
                  </p>
                ) : null}
              </div>
            ) : null}

            <button className="btn-primary w-full" disabled={loading}>
              {loading ? 'Generating reset link...' : 'Send reset link'}
            </button>
          </form>

          <p className="muted mt-6 text-sm">
            Remembered your password?{' '}
            <Link to="/login" className="font-semibold text-[var(--primary-strong)]">
              Back to login
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
}
