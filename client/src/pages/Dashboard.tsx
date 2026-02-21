import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [projects, setProjects] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = await api.get('/api/auth/me');
        if (mounted) setUser(u.data);
      } catch (e) {
        // user may be unauthenticated
      }

      try {
        const { data } = await api.get('/api/projects');
        const normalizedProjects = Array.isArray(data) ? data : data?.projects || [];
        if (mounted) setProjects(normalizedProjects);
      } catch (e) {
        if (mounted) setError('Could not load projects. Try refreshing.');
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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="pill">Workspace</span>
              <h1 className="title-lg mt-3">Dashboard</h1>
              <p className="muted mt-2 text-sm sm:text-base">
                Monitor your GenAI projects, account plan, and billing access.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-xl border border-[var(--stroke)] bg-white/80 px-3 py-2 text-sm">
                <span className="muted">Plan: </span>
                <span className="font-semibold capitalize">{user?.plan || 'guest'}</span>
              </div>
              {user?.plan !== 'premium' ? (
                <button onClick={() => nav('/billing')} className="btn-primary">
                  Upgrade
                </button>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      const { data } = await api.get('/api/billing/portal');
                      window.location.href = data.url;
                    } catch (e) {
                      alert('Could not open billing portal');
                    }
                  }}
                  className="btn-secondary"
                >
                  Open Billing Portal
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="surface p-6 sm:p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold sm:text-2xl">Projects</h2>
            <span className="muted text-sm">{projects.length} total</span>
          </div>

          {error ? (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : (
            <></>
          )}

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((slot) => (
                <div key={slot} className="section-card animate-pulse">
                  <div className="h-4 w-1/2 rounded bg-slate-200" />
                  <div className="mt-3 h-3 w-2/3 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : projects.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <article key={project._id} className="section-card flex h-full flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {project.name || `Project ${String(project._id).slice(-6)}`}
                    </h3>
                    <p className="muted mt-2 break-all text-xs sm:text-sm">ID: {project._id}</p>
                  </div>
                  <button
                    onClick={() => nav(`/project/${project._id}`)}
                    className="btn-secondary mt-5 w-full"
                  >
                    Open editor
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className="section-card text-center">
              <h3 className="text-lg font-semibold">No projects yet</h3>
              <p className="muted mt-2 text-sm">
                Create your first GenAI project from the backend workflow and it will appear here.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
