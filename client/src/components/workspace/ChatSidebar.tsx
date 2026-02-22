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

export default function ChatSidebar(props: ChatSidebarProps) {
  return (
    <aside className={`workspace-gem-sidebar ${props.isCollapsed ? 'collapsed' : ''}`}>
      <div className="workspace-gem-sidebar-top">
        <button className="workspace-rail-btn" type="button" onClick={props.onToggleCollapse}>
          {props.isCollapsed ? '>>' : '<<'}
        </button>
        <button className="workspace-rail-btn" type="button" onClick={props.onStartNewChat}>
          +
        </button>
      </div>

      <div className="workspace-gem-sidebar-brand">{props.isCollapsed ? 'AI' : 'DevAI'}</div>

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
                  <span className="truncate">{chat.title}</span>
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
