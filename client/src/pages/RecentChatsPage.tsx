import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import WorkspaceLayout from '../components/WorkspaceLayout';

type ChatItem = {
  _id: string;
  title: string;
  updatedAt: string;
  project?: { _id: string; name: string } | null;
};

export default function RecentChatsPage() {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [error, setError] = useState('');
  const nav = useNavigate();

  async function loadChats(query = '') {
    setError('');
    try {
      const { data } = await api.get('/api/ai/chats', { params: { search: query } });
      setChats(data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not load recent chats.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadChats();
  }, []);

  return (
    <WorkspaceLayout
      title="Recent Chats"
      subtitle="Search your past AI conversations and reopen any thread."
    >
      <section className="surface p-5 sm:p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-input flex-1"
            placeholder="Search by title or message content..."
          />
          <button className="btn-primary" onClick={() => loadChats(search)}>
            Search
          </button>
        </div>

        {error ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((slot) => (
              <div key={slot} className="h-16 animate-pulse rounded-xl bg-white/75" />
            ))}
          </div>
        ) : chats.length ? (
          <div className="grid gap-3">
            {chats.map((chat) => (
              <article
                key={chat._id}
                className="section-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="font-semibold">{chat.title}</h3>
                  <p className="muted mt-1 text-sm">
                    {chat.project?.name ? `Project: ${chat.project.name}` : 'No linked project'}
                  </p>
                </div>
                <button className="btn-secondary" onClick={() => nav(`/chat?chat=${chat._id}`)}>
                  Reopen Chat
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="section-card text-center">
            <h3 className="text-lg font-semibold">No conversations found</h3>
            <p className="muted mt-2 text-sm">Start a new chat from the Chat page.</p>
          </div>
        )}
      </section>
    </WorkspaceLayout>
  );
}
