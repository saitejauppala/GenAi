import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import RichMessage from './RichMessage';

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

type ChatWorkspaceProps = {
  messages: WorkspaceMessage[];
  prompt: string;
  sending: boolean;
  healthStatus: 'ONLINE' | 'OFFLINE' | 'UNKNOWN';
  healthMessage: string;
  isAuthenticated: boolean;
  recentChats: RecentChat[];
  activeChatId: string | null;
  onStartNewChat: () => void;
  onOpenChat: (chatId: string) => void;
  onPromptChange: (value: string) => void;
  onSendPrompt: () => void;
  onCopyMessage: (message: WorkspaceMessage) => void;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function chatTitle(chat: RecentChat) {
  const title = String(chat.title || '').trim();
  return title || 'Untitled chat';
}

export default function ChatWorkspace(props: ChatWorkspaceProps) {
  const threadRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatSearch, setChatSearch] = useState('');

  useEffect(() => {
    if (!threadRef.current || !bottomRef.current) return;
    bottomRef.current.scrollIntoView({ block: 'end' });
  }, [props.messages, props.sending]);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!menuRef.current) return;
      if (menuRef.current.contains(event.target as Node)) return;
      setMenuOpen(false);
    }

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('touchstart', handlePointerDown);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('touchstart', handlePointerDown);
    };
  }, [menuOpen]);

  const filteredChats = useMemo(() => {
    const query = chatSearch.trim().toLowerCase();
    if (!query) return props.recentChats;
    return props.recentChats.filter((chat) => chatTitle(chat).toLowerCase().includes(query));
  }, [chatSearch, props.recentChats]);

  const activeChatTitle = useMemo(() => {
    if (!props.activeChatId) return 'New Chat';
    const match = props.recentChats.find((chat) => chat._id === props.activeChatId);
    return match ? chatTitle(match) : 'Current Chat';
  }, [props.activeChatId, props.recentChats]);

  function handleStartNewChat() {
    props.onStartNewChat();
    setMenuOpen(false);
    setChatSearch('');
  }

  function handleOpenChat(chatId: string) {
    props.onOpenChat(chatId);
    setMenuOpen(false);
  }

  return (
    <section className="workspace-gem-main">
      <header className="workspace-gem-header workspace-gem-header-single">
        <div className="workspace-gem-header-center">
          <h2>Project Ideas For You</h2>
          <div className="workspace-chat-menu-wrap" ref={menuRef}>
            <button
              type="button"
              className="workspace-chat-menu-trigger"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <span className="workspace-chat-menu-label">{activeChatTitle}</span>
              <span className={`workspace-chat-menu-chevron ${menuOpen ? 'open' : ''}`}>v</span>
            </button>

            {menuOpen ? (
              <div className="workspace-chat-menu-dropdown" role="menu">
                <div className="workspace-chat-menu-actions">
                  <button className="workspace-chat-menu-new" type="button" onClick={handleStartNewChat}>
                    + New Chat
                  </button>
                </div>

                {props.isAuthenticated ? (
                  <>
                    <input
                      type="search"
                      placeholder="Search chats"
                      value={chatSearch}
                      onChange={(e) => setChatSearch(e.target.value)}
                      className="workspace-chat-menu-search"
                    />
                    <div className="workspace-chat-menu-list">
                      {filteredChats.length ? (
                        filteredChats.map((chat) => (
                          <button
                            key={chat._id}
                            type="button"
                            className={`workspace-chat-menu-item ${
                              props.activeChatId === chat._id ? 'active' : ''
                            }`}
                            onClick={() => handleOpenChat(chat._id)}
                          >
                            <span className="workspace-chat-menu-item-title">{chatTitle(chat)}</span>
                            <small>{formatDate(chat.updatedAt)}</small>
                          </button>
                        ))
                      ) : (
                        <p className="workspace-chat-menu-empty">No matching chats.</p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="workspace-chat-menu-empty">
                    Login required to see recent chats.{' '}
                    <Link to="/login" onClick={() => setMenuOpen(false)}>
                      Sign in
                    </Link>
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="workspace-gem-header-right">
          <span className={`workspace-health-chip ${props.healthStatus.toLowerCase()}`}>
            {props.healthStatus}
          </span>
        </div>
      </header>

      {props.healthStatus === 'OFFLINE' ? (
        <div className="workspace-alert rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          AI Server Offline: {props.healthMessage}
        </div>
      ) : null}

      <div className="workspace-gem-thread" ref={threadRef}>
        <div className="workspace-gem-thread-inner">
          {props.messages.map((message) => (
            <article
              key={message.id}
              className={`workspace-gem-message ${
                message.role === 'user' ? 'workspace-gem-message-user' : 'workspace-gem-message-assistant'
              }`}
            >
              <div className="workspace-gem-message-body">
                {message.role === 'assistant' ? (
                  <div className="workspace-gem-assistant-mark">*</div>
                ) : null}
                <div className="workspace-gem-message-content">
                  <RichMessage content={message.content} />
                  {message.meta ? <p className="muted mt-2 text-xs">{message.meta}</p> : null}
                  {message.role === 'assistant' ? (
                    <button
                      className="workspace-copy-btn mt-3"
                      type="button"
                      onClick={() => props.onCopyMessage(message)}
                    >
                      Copy
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}

          {props.sending ? (
            <div className="workspace-typing-indicator">
              <span className="workspace-dot" />
              <span className="workspace-dot" />
              <span className="workspace-dot" />
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>
      </div>

      <form
        className="workspace-gem-composer"
        onSubmit={(e) => {
          e.preventDefault();
          props.onSendPrompt();
        }}
      >
        <div className="workspace-gem-input-shell">
          <textarea
            value={props.prompt}
            onChange={(e) => props.onPromptChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                props.onSendPrompt();
              }
            }}
            placeholder="Ask DevAI..."
            className="workspace-gem-textarea"
            disabled={props.sending}
            rows={2}
          />
          <div className="workspace-gem-input-footer">
            <div className="workspace-gem-tools">
              <span>+</span>
              <span>Tools</span>
            </div>
            {!props.isAuthenticated ? (
              <p className="muted text-xs">
                Guest mode.{' '}
                <Link to="/login" className="font-semibold text-[var(--primary)]">
                  Login for full access
                </Link>
              </p>
            ) : (
              <p className="muted text-xs">Enter to send, Shift+Enter for new line</p>
            )}
            <button className="btn-primary min-w-[96px]" disabled={props.sending || !props.prompt.trim()}>
              {props.sending ? '...' : 'Send'}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
