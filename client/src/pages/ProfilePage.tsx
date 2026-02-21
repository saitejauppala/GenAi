import React, { useEffect, useState } from 'react';
import api from '../api';
import WorkspaceLayout from '../components/WorkspaceLayout';

type ProfileForm = {
  name: string;
  email: string;
  title: string;
  location: string;
  bio: string;
  avatarDataUrl: string;
};

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileForm>({
    name: '',
    email: '',
    title: '',
    location: '',
    bio: '',
    avatarDataUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadProfile() {
    setError('');
    try {
      const { data } = await api.get('/api/profile/me');
      setForm({
        name: data?.name || '',
        email: data?.email || '',
        title: data?.title || '',
        location: data?.location || '',
        bio: data?.bio || '',
        avatarDataUrl: data?.avatarDataUrl || ''
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not load profile.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.put('/api/profile/me', {
        name: form.name,
        title: form.title,
        location: form.location,
        bio: form.bio,
        avatarDataUrl: form.avatarDataUrl
      });
      setMessage('Profile updated successfully.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <WorkspaceLayout
      title="Profile"
      subtitle="Manage your account details and avatar stored in MongoDB."
    >
      <section className="surface p-5 sm:p-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((slot) => (
              <div key={slot} className="h-12 animate-pulse rounded-xl bg-white/75" />
            ))}
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-4 lg:grid-cols-[220px_1fr]">
            <div className="section-card flex flex-col items-center gap-3">
              {form.avatarDataUrl ? (
                <img
                  src={form.avatarDataUrl}
                  alt="Avatar"
                  className="h-28 w-28 rounded-full border border-[var(--stroke)] object-cover"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full border border-dashed border-[var(--stroke)] text-sm muted">
                  No Avatar
                </div>
              )}
              <label className="btn-secondary w-full cursor-pointer text-center">
                Upload Avatar
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const dataUrl = await toDataUrl(file);
                    setForm((prev) => ({ ...prev, avatarDataUrl: dataUrl }));
                  }}
                />
              </label>
            </div>

            <div className="section-card space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="text-input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Email</label>
                  <input value={form.email} className="text-input" readOnly />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="text-input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Location</label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                    className="text-input"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
                  className="text-input min-h-[140px]"
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

              <button className="btn-primary w-full sm:w-auto" disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}
      </section>
    </WorkspaceLayout>
  );
}
