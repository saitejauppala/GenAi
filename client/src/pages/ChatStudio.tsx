import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setToken } from '../store/slices/authSlice';

type ChatMode = 'assist' | 'generate';
type MessageRole = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  meta?: string;
  projectId?: string;
}

function buildGuestPreview(prompt: string): string {
  const cleanPrompt = prompt.trim();
  if (!cleanPrompt) return 'Describe your idea and I will map it into a project blueprint.';

  const name = cleanPrompt
    .replace(/[^\w\s-]/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 6)
    .join(' ');

  return [
    `Starter blueprint for "${name || 'New Project'}":`,
    '- Define one core user flow and one admin flow.',
    '- Create API routes for auth, project data, and generation jobs.',
    '- Build a React app shell with dashboard, editor, and settings pages.',
    '- Add a persistent store for project files, prompts, and output history.',
    '',
    'Sign in to run full AI generation, save projects, and use advanced workflows.'
  ].join('\n');
}

function deriveProjectName(prompt: string): string {
  const candidate = prompt
    .replace(/[^\w\s-]/g, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 7)
    .join(' ');
  return candidate || `Generated Project ${new Date().toLocaleDateString()}`;
}

export default function ChatStudio() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text:
        'I can help you plan, scaffold, and generate software projects.\n' +
        'Use Assist for architecture help, or Generate for full app output.'
    }
  ]);
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<ChatMode>('assist');
  const [sending, setSending] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(localStorage.getItem('token')));
  const dispatch = useDispatch();
  const nav = useNavigate();
  const bottomRef = useRef<HTMLDivElement>(null);

  const quickPrompts = useMemo(
    () => [
      'Build a SaaS for appointment booking with admin analytics.',
      'Generate a MERN CRM with lead pipeline and email reminders.',
      'Create an AI code review platform with team roles and billing.'
    ],
    []
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!localStorage.getItem('token')) {
        if (mounted) {
          setIsAuthenticated(false);
          setCheckingAuth(false);
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
      } catch (err) {
        localStorage.removeItem('token');
        dispatch(setToken(null));
        if (mounted) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted) setCheckingAuth(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [dispatch]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  function addAssistantMessage(text: string, meta?: string, projectId?: string) {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        role: 'assistant',
        text,
        meta,
        projectId
      }
    ]);
  }

  function logout() {
    localStorage.removeItem('token');
    dispatch(setToken(null));
    setUser(null);
    setIsAuthenticated(false);
    addAssistantMessage('You are now in guest mode. Sign in for full project generation.');
  }

  async function submitPrompt(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = prompt.trim();
    if (!input || sending) return;
    setPrompt('');

    setMessages((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        role: 'user',
        text: input
      }
    ]);

    if (!isAuthenticated) {
      addAssistantMessage(buildGuestPreview(input), 'Guest preview only');
      return;
    }

    setSending(true);
    try {
      if (mode === 'assist') {
        const { data } = await api.post('/api/ai/assist', { prompt: input });
        const meta = `Assist response - ${data?.tokensUsed ?? 0} tokens`;
        addAssistantMessage(data?.text || 'No response from AI service.', meta);
      } else {
        const { data } = await api.post('/api/ai/generate', { prompt: input });
        const generatedText = data?.output || 'No project output returned.';
        let projectId: string | undefined;
        try {
          const created = await api.post('/api/projects', {
            name: deriveProjectName(input),
            description: input,
            files: { 'GENERATED_OUTPUT.md': generatedText }
          });
          projectId = created?.data?._id;
        } catch (projectErr) {
          // Generation succeeded even if persistence failed.
        }

        const meta = `Generate response - ${data?.tokensUsed ?? 0} tokens`;
        addAssistantMessage(generatedText, meta, projectId);
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message;

      if (status === 401) {
        localStorage.removeItem('token');
        dispatch(setToken(null));
        setIsAuthenticated(false);
        setUser(null);
        addAssistantMessage('Session expired. Please sign in again to continue.');
      } else if (status === 402) {
        addAssistantMessage('Full app generation requires a premium plan. Upgrade in billing.');
      } else if (status === 429) {
        addAssistantMessage(message || 'Rate limit reached. Please try again shortly.');
      } else {
        addAssistantMessage(message || 'AI request failed. Please retry.');
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="page-wrap">
      <div className="page-container max-w-6xl space-y-4 fade-up">
        <header className="surface flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <span className="pill">Chat Studio</span>
            <h1 className="title-lg mt-3">Build Projects With AI</h1>
            <p className="muted mt-2 text-sm sm:text-base">
              This is now the homepage. Start a project in chat, then open it in the editor.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {isAuthenticated ? (
              <>
                <button onClick={() => nav('/dashboard')} className="btn-secondary">
                  Dashboard
                </button>
                {user?.plan !== 'premium' ? (
                  <button onClick={() => nav('/billing')} className="btn-primary">
                    Upgrade
                  </button>
                ) : null}
                <button onClick={logout} className="btn-secondary">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-primary">
                  Login
                </Link>
                <Link to="/register" className="btn-secondary">
                  Register
                </Link>
              </>
            )}
          </div>
        </header>

        <div className="surface grid gap-4 p-4 sm:p-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-4">
            <div className="section-card">
              <h2 className="text-lg font-semibold">Mode</h2>
              <p className="muted mt-1 text-sm">
                Use `Assist` for guidance, `Generate` for full application output.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMode('assist')}
                  className={mode === 'assist' ? 'btn-primary' : 'btn-secondary'}
                >
                  Assist
                </button>
                <button
                  onClick={() => setMode('generate')}
                  className={mode === 'generate' ? 'btn-primary' : 'btn-secondary'}
                >
                  Generate
                </button>
              </div>
            </div>

            <div className="section-card">
              <h3 className="font-semibold">Access</h3>
              {checkingAuth ? (
                <p className="muted mt-1 text-sm">Checking session...</p>
              ) : isAuthenticated ? (
                <p className="muted mt-1 text-sm">
                  Signed in as <span className="font-semibold text-[var(--ink)]">{user?.email}</span>
                </p>
              ) : (
                <p className="muted mt-1 text-sm">
                  Guest mode active. Sign in to unlock full AI generation and saved projects.
                </p>
              )}
            </div>

            <div className="section-card">
              <h3 className="font-semibold">Quick Ideas</h3>
              <div className="mt-3 space-y-2">
                {quickPrompts.map((idea) => (
                  <button
                    key={idea}
                    onClick={() => setPrompt(idea)}
                    className="w-full rounded-lg border border-[var(--stroke)] bg-white/85 p-2 text-left text-xs transition hover:bg-white"
                  >
                    {idea}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className="section-card flex min-h-[520px] flex-col p-3 sm:p-4">
            <div className="flex-1 space-y-3 overflow-y-auto px-1 pb-4">
              {messages.map((message) => {
                const isUser = message.role === 'user';
                return (
                  <article
                    key={message.id}
                    className={`max-w-[92%] rounded-2xl px-3.5 py-3 sm:max-w-[85%] ${
                      isUser
                        ? 'ml-auto bg-[var(--primary)] text-white'
                        : 'border border-[var(--stroke)] bg-white/90 text-[var(--ink)]'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.text}</p>
                    {message.meta ? (
                      <p className={`mt-2 text-xs ${isUser ? 'text-white/80' : 'muted'}`}>{message.meta}</p>
                    ) : null}
                    {message.projectId ? (
                      <button
                        onClick={() => nav(`/project/${message.projectId}`)}
                        className="btn-secondary mt-3 w-full"
                      >
                        Open Generated Project
                      </button>
                    ) : null}
                  </article>
                );
              })}
              {sending ? (
                <div className="w-fit rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm">
                  Generating...
                </div>
              ) : null}
              <div ref={bottomRef} />
            </div>

            {!isAuthenticated ? (
              <div className="mx-1 mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Login unlocks full generation, persistent projects, and premium capabilities.
              </div>
            ) : null}

            <form onSubmit={submitPrompt} className="mt-1 flex flex-col gap-2 sm:flex-row">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the project you want to build..."
                className="text-input flex-1"
                disabled={sending}
              />
              <button className="btn-primary min-w-[120px]" disabled={sending || !prompt.trim()}>
                Send
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
