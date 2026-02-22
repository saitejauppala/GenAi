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
  recentSearch: string;
  onToggleCollapse: () => void;
  onStartNewChat: () => void;
  onRecentSearchChange: (value: string) => void;
  onOpenChat: (chatId: string) => void;
};

function timeLabel(value: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function ChatSidebar(props: ChatSidebarProps) {
  const widthClass = props.isCollapsed ? 'w-[76px]' : 'w-[290px]';

  return (
    <aside className={`workspace-column workspace-sidebar-column ${widthClass}`}>
      <div className="workspace-sidebar-header">
        <button className="btn-secondary w-full" onClick={props.onToggleCollapse}>
          {props.isCollapsed ? '>' : 'Collapse'}
        </button>
        {!props.isCollapsed ? (
          <button className="btn-primary w-full" onClick={props.onStartNewChat}>
            New Chat
          </button>
        ) : null}
      </div>

      {!props.isCollapsed ? (
        <>
          <section className="section-card p-3">
            <h3 className="text-sm font-semibold">Search Chats</h3>
            <input
              value={props.recentSearch}
              onChange={(e) => props.onRecentSearchChange(e.target.value)}
              className="text-input mt-2"
              placeholder="Find conversation..."
              disabled={!props.isAuthenticated}
            />
          </section>

          <section className="section-card workspace-recent-list p-2">
            <h3 className="px-2 pt-1 text-sm font-semibold">Recent</h3>
            <div className="mt-2 space-y-2">
              {!props.isAuthenticated ? (
                <p className="muted px-2 text-sm">
                  Login required.{' '}
                  <Link to="/login" className="font-semibold text-[var(--primary)]">
                    Sign in
                  </Link>
                </p>
              ) : props.recentChats.length ? (
                props.recentChats.map((chat) => (
                  <button
                    key={chat._id}
                    onClick={() => props.onOpenChat(chat._id)}
                    className="workspace-recent-item"
                  >
                    <p className="truncate font-medium">{chat.title}</p>
                    <p className="muted mt-1 text-xs">{timeLabel(chat.updatedAt)}</p>
                  </button>
                ))
              ) : (
                <p className="muted px-2 text-sm">No conversations yet.</p>
              )}
            </div>
          </section>
        </>
      ) : null}
    </aside>
  );
}
