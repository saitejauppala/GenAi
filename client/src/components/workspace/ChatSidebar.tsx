import React from 'react';
import { Link } from 'react-router-dom';

type RecentChat = {
  _id: string;
  title: string;
  updatedAt: string;
};

type ChatSidebarProps = {
  isCollapsed: boolean;
  isAuthenticated: boolean;
  recentChats: RecentChat[];
  onToggleCollapse: () => void;
  onStartNewChat: () => void;
  onOpenChat: (chatId: string) => void;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export default function ChatSidebar(props: ChatSidebarProps) {
  return (
    <aside className={`workspace-gem-sidebar neon-sidebar ${props.isCollapsed ? 'collapsed' : ''}`}>
      <div className="workspace-gem-sidebar-top">
        <button className="workspace-rail-btn neon-btn" type="button" onClick={props.onToggleCollapse}>
          {props.isCollapsed ? '>>' : '<<'}
        </button>
        <button className="workspace-rail-btn neon-btn" type="button" onClick={props.onStartNewChat}>
          +
        </button>
      </div>

      <div className="workspace-gem-sidebar-brand">{props.isCollapsed ? 'AI' : 'DevAI Neon'}</div>

      <div className="workspace-side-icons">
        <Link className="workspace-side-icon" to="/chat" title="Chat">
          <Icon d="M4 5h16v11H7l-3 3V5zm4 4h8v2H8V9z" />
          {!props.isCollapsed ? <span>Chat</span> : null}
        </Link>
        <Link className="workspace-side-icon" to="/profile" title="Profile">
          <Icon d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z" />
          {!props.isCollapsed ? <span>Profile</span> : null}
        </Link>
        <button className="workspace-side-icon" type="button" onClick={props.onStartNewChat} title="New">
          <Icon d="M19 11H13V5h-2v6H5v2h6v6h2v-6h6v-2z" />
          {!props.isCollapsed ? <span>New</span> : null}
        </button>
      </div>

      {!props.isCollapsed ? (
        <div className="workspace-gem-sidebar-body">
          <h3 className="workspace-sidebar-heading">Recent</h3>
          {!props.isAuthenticated ? (
            <p className="muted text-sm">
              Login required.{' '}
              <Link to="/login" className="font-semibold text-[var(--primary)]">
                Sign in
              </Link>
            </p>
          ) : props.recentChats.length ? (
            <div className="workspace-gem-recent-list">
              {props.recentChats.map((chat) => (
                <button
                  key={chat._id}
                  className="workspace-gem-recent-item"
                  onClick={() => props.onOpenChat(chat._id)}
                >
                  <span className="workspace-recent-title truncate">{chat.title}</span>
                  <small>{formatDate(chat.updatedAt)}</small>
                </button>
              ))}
            </div>
          ) : (
            <p className="muted text-sm">No chats yet.</p>
          )}
        </div>
      ) : null}
    </aside>
  );
}
