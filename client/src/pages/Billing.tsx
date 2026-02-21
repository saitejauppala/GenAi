import React, { useState } from 'react';
import api from '../api';

export default function Billing() {
  const defaultPrice = (import.meta.env.VITE_PRICE_ID as string) || '';
  const [priceId, setPriceId] = useState(defaultPrice);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function checkout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!priceId) {
      setError('Missing price ID. Set VITE_PRICE_ID or enter one.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/api/billing/create-checkout', { priceId });
      window.location.href = data.url;
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  }

  async function openPortal() {
    setError('');
    setMessage('');
    try {
      const { data } = await api.get('/api/billing/portal');
      window.location.href = data.url;
    } catch (err) {
      setMessage('Billing portal is unavailable for this account right now.');
    }
  }

  return (
    <div className="page-wrap">
      <div className="page-container max-w-5xl fade-up">
        <div className="surface grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_1.15fr] lg:gap-8 lg:p-10">
          <section>
            <span className="pill">Billing</span>
            <h1 className="title-lg mt-4">Upgrade your GenAI workspace</h1>
            <p className="muted mt-3 text-sm sm:text-base">
              Unlock premium limits, priority processing, and advanced workspace controls through
              secure Stripe checkout.
            </p>

            <div className="mt-6 space-y-3">
              <div className="section-card">
                <h3 className="font-semibold">Premium plan benefits</h3>
                <p className="muted mt-1 text-sm">Higher usage limits, faster generation throughput, and support.</p>
              </div>
              <div className="section-card">
                <h3 className="font-semibold">Self-service billing portal</h3>
                <p className="muted mt-1 text-sm">Manage payment methods and invoices anytime.</p>
              </div>
            </div>
          </section>

          <section className="section-card">
            <h2 className="text-xl font-semibold sm:text-2xl">Checkout</h2>
            <p className="muted mt-1 text-sm">Provide your Stripe price ID and continue securely.</p>

            <form onSubmit={checkout} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Price ID</label>
                <input
                  value={priceId}
                  onChange={(e) => setPriceId(e.target.value)}
                  placeholder="price_..."
                  className="text-input"
                />
              </div>

              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              ) : null}

              {message ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  {message}
                </p>
              ) : null}

              <button className="btn-primary w-full" disabled={loading}>
                {loading ? 'Redirecting...' : 'Upgrade to Premium'}
              </button>
            </form>

            <div className="mt-4">
              <button onClick={openPortal} className="btn-secondary w-full">
                Open Customer Portal
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
