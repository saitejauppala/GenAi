import React, { useEffect, useState } from 'react';
import api from '../api';
import ChatSidebar from '../components/workspace/ChatSidebar';
import ChatWorkspace from '../components/workspace/ChatWorkspace';
import { parseGeneratedArtifacts } from '../lib/aiFormatting';

type WorkspaceMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  meta?: string;
};

type RecentChat = {
  _id: string;
  title: string;
  updatedAt: string;
};

type HealthState = {
  status: 'ONLINE' | 'OFFLINE' | 'UNKNOWN';
  checkedAt: string | null;
  message: string;
};

function guestPreview(prompt: string) {
  const text = prompt.trim() || 'your idea';
  return [
    `Starter plan for "${text.slice(0, 60)}":`,
    '- Clarify user flow and core feature list.',
    '- Ask AI for backend and frontend implementation steps.',
    '- Request code in fenced blocks or FILE markers.',
    '',
    'Login to access full generation.'
  ].join('\n');
}

export default function AIChatPage() {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WorkspaceMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
  const [sending, setSending] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(localStorage.getItem('token')));
  const [health, setHealth] = useState<HealthState>({
    status: 'UNKNOWN',
    checkedAt: null,
    message: 'Checking AI health...'
  });

  useEffect(() => {
    if (!messages.length) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content:
            'Welcome to DevAI.\nDescribe what you want to build and I will generate the implementation response.'
        }
      ]);
    }
  }, [messages.length]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        if (mounted) {
          setIsAuthenticated(false);
          setCheckingAuth(false);
        }
        return;
      }

      try {
        await api.get('/api/auth/me');
        if (!mounted) return;
        setIsAuthenticated(true);
        const { data } = await api.get('/api/ai/chats');
        if (!mounted) return;
        setRecentChats(data || []);
      } catch {
        if (mounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted) setCheckingAuth(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function pollHealth(force = false) {
      try {
        const response = force
          ? await api.post('/api/ai/health-check')
          : await api.get('/api/ai/health-check');
        if (active) setHealth(response.data);
      } catch {
        if (active) {
          setHealth({
            status: 'OFFLINE',
            checkedAt: new Date().toISOString(),
            message: 'AI health endpoint is unreachable.'
          });
        }
      }
    }

    pollHealth(true);
    const timer = setInterval(() => pollHealth(false), 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  async function refreshRecentChats() {
    if (!isAuthenticated) return;
    const { data } = await api.get('/api/ai/chats');
    setRecentChats(data || []);
  }

  async function openChat(chatId: string) {
    if (!isAuthenticated) return;
    const { data } = await api.get(`/api/ai/chats/${chatId}`);
    const parsedMessages: WorkspaceMessage[] = (data?.messages || []).map((item: any, index: number) => ({
      id: `${chatId}-${index}`,
      role: item.role,
      content: String(item.content || '')
    }));

    const fallback = [{ id: 'empty-chat', role: 'assistant' as const, content: 'No messages yet.' }];
    const nextMessages = parsedMessages.length ? parsedMessages : fallback;
    setMessages(nextMessages);
    setActiveChatId(data?._id || chatId);
  }

  function startNewChat() {
    setActiveChatId(null);
    setMessages([
      {
        id: `new-chat-${Date.now()}`,
        role: 'assistant',
        content: 'New chat started. Describe the app or feature you need.'
      }
    ]);
  }

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // ignored
    }
  }

  async function sendPrompt() {
    const input = prompt.trim();
    if (!input || sending) return;
    setPrompt('');
    const userMessageId = `u-${Date.now()}`;
    setMessages((prev) => [...prev, { id: userMessageId, role: 'user', content: input }]);

    if (!isAuthenticated) {
      const guestId = `g-${Date.now()}`;
      const preview = guestPreview(input);
      setMessages((prev) => [
        ...prev,
        { id: guestId, role: 'assistant', content: preview, meta: 'Guest preview' }
      ]);
      return;
    }

    if (health.status === 'OFFLINE') {
      setMessages((prev) => [
        ...prev,
        {
          id: `offline-${Date.now()}`,
          role: 'assistant',
          content: 'AI Server Offline. Retry after the remote Ollama tunnel is online.'
        }
      ]);
      return;
    }

    setSending(true);
    try {
      const { data } = await api.post('/api/ai/generate', {
        prompt: input,
        chatId: activeChatId || undefined,
        saveToProject: false
      });

      const assistantId = `a-${Date.now()}`;
      const rawText = String(data?.text || 'No response received.');
      const parsed = parseGeneratedArtifacts(rawText, assistantId);
      const typedText = parsed.displayText || rawText;

      setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '', meta: '' }]);

      for (let i = 1; i <= typedText.length; i += 6) {
        const chunk = typedText.slice(0, i);
        setMessages((prev) =>
          prev.map((item) =>
            item.id === assistantId
              ? { ...item, content: chunk, meta: `${data?.model || 'ollama'} | ${data?.tokensUsed || 0} tokens` }
              : item
          )
        );
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      setActiveChatId(data.chatId || null);
      await refreshRecentChats();
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: err?.response?.data?.message || 'AI request failed.'
        }
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="workspace-shell">
      <div className="workspace-gem-layout">
        <ChatSidebar
          isCollapsed={sidebarCollapsed}
          isAuthenticated={isAuthenticated}
          recentChats={recentChats}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
          onStartNewChat={startNewChat}
          onOpenChat={openChat}
        />

        <ChatWorkspace
          messages={messages}
          prompt={prompt}
          sending={sending}
          healthStatus={health.status}
          healthMessage={health.message}
          isAuthenticated={isAuthenticated && !checkingAuth}
          onPromptChange={setPrompt}
          onSendPrompt={sendPrompt}
          onCopyMessage={(message) => copyText(message.content)}
        />
      </div>
    </div>
  );
}
