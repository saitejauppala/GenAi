import React, { useEffect, useState } from 'react';
import api from '../api';

export default function AdminPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get('/api/admin/users');
        if (mounted) setUsers(data || []);
      } catch (err) {
        if (mounted) setError('Could not load users.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="page-wrap">
      <div className="page-container space-y-6 fade-up">
        <section className="surface p-6 sm:p-8">
          <span className="pill">Admin</span>
          <h1 className="title-lg mt-3">User Management</h1>
          <p className="muted mt-2 text-sm sm:text-base">
            Review user access, account roles, and subscription plans.
          </p>
        </section>

        <section className="surface p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold sm:text-xl">Users</h2>
            <span className="muted text-sm">{users.length} records</span>
          </div>

          {error ? (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((slot) => (
                <div key={slot} className="h-14 animate-pulse rounded-xl bg-white/75" />
              ))}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full overflow-hidden rounded-2xl border border-[var(--stroke)] bg-white/90">
                  <thead className="bg-slate-100/80 text-left text-sm">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">Role</th>
                      <th className="px-4 py-3 font-semibold">Plan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="border-t border-[var(--stroke)] text-sm">
                        <td className="px-4 py-3 break-all">{user.email}</td>
                        <td className="px-4 py-3 capitalize">{user.role}</td>
                        <td className="px-4 py-3 capitalize">{user.plan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 md:hidden">
                {users.map((user) => (
                  <article key={user._id} className="section-card">
                    <p className="break-all text-sm font-medium">{user.email}</p>
                    <p className="muted mt-2 text-sm">
                      Role: <span className="font-medium capitalize text-[var(--ink)]">{user.role}</span>
                    </p>
                    <p className="muted mt-1 text-sm">
                      Plan: <span className="font-medium capitalize text-[var(--ink)]">{user.plan}</span>
                    </p>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
