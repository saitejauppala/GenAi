import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import api from '../api';

type WorkspaceLayoutProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

type ThemeMode = 'light' | 'dark';

function getStoredTheme(): ThemeMode {
  const saved = localStorage.getItem('theme');
  return saved === 'dark' ? 'dark' : 'light';
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

export default function WorkspaceLayout(props: WorkspaceLayoutProps) {
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme());
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(localStorage.getItem('token')));
  const nav = useNavigate();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        if (mounted) {
          setIsAuthenticated(false);
          setUser(null);
        }
        return;
      }

      try {
        const { data } = await api.get('/api/auth/me');
        if (mounted) {
          setUser(data);
          setIsAuthenticated(true);
        }
      } catch {
        if (mounted) {
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const navItems = useMemo(
    () => [
      { to: '/chat', label: 'Chat' },
      { to: '/recent', label: 'Recent' },
      { to: '/projects', label: 'Projects' },
      { to: '/profile', label: 'Profile' }
    ],
    []
  );

  function logout() {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    nav('/login');
  }

  return (
    <div className="page-wrap">
      <div className="page-container workspace-grid fade-up">
        <aside className="workspace-sidebar">
          <div className="section-card p-4">
            <p className="pill">DevAI Pro</p>
            <h2 className="mt-3 text-xl font-semibold">Workspace</h2>
            <p className="muted mt-1 text-sm">Build with local AI, files, and projects.</p>
          </div>

          <nav className="section-card grid gap-1 p-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="section-card space-y-2 p-4">
            <button
              className="btn-secondary w-full"
              onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
            >
              {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
            </button>

            {isAuthenticated ? (
              <>
                <p className="muted break-all text-xs">Signed in: {user?.email || 'User'}</p>
                <button className="btn-secondary w-full" onClick={logout}>
                  Logout
                </button>
              </>
            ) : (
              <div className="grid gap-2">
                <Link to="/login" className="btn-primary w-full">
                  Login
                </Link>
                <Link to="/register" className="btn-secondary w-full">
                  Register
                </Link>
              </div>
            )}
          </div>
        </aside>

        <section className="space-y-4">
          <header className="surface p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="title-lg">{props.title}</h1>
                {props.subtitle ? <p className="muted mt-1 text-sm sm:text-base">{props.subtitle}</p> : null}
              </div>
              {props.actions ? <div className="flex flex-wrap gap-2">{props.actions}</div> : null}
            </div>
          </header>

          {props.children}
        </section>
      </div>
    </div>
  );
}
