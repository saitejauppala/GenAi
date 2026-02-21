import React from 'react';
import { Link } from 'react-router-dom';

type RecentChat = {
  _id: string;
  title: string;
  updatedAt: string;
  project?: { _id: string; name: string } | null;
};

type Project = {
  _id: string;
  name: string;
};

type ChatSidebarProps = {
  isCollapsed: boolean;
  isAuthenticated: boolean;
  projects: Project[];
  activeProjectId: string;
  recentChats: RecentChat[];
  recentSearch: string;
  onToggleCollapse: () => void;
  onStartNewChat: () => void;
  onRecentSearchChange: (value: string) => void;
  onOpenChat: (chatId: string) => void;
  onProjectSelect: (projectId: string) => void;
};

export default function ChatSidebar(props: ChatSidebarProps) {
  const widthClass = props.isCollapsed ? 'w-[72px]' : 'w-[280px]';

  return (
    <aside className={`workspace-column workspace-sidebar-column ${widthClass}`}>
      <div className="workspace-sidebar-header">
        <button className="btn-secondary w-full" onClick={props.onToggleCollapse}>
          {props.isCollapsed ? 'Open' : 'Collapse'}
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
            <h3 className="text-sm font-semibold">Project Selector</h3>
            <select
              className="text-input mt-2"
              value={props.activeProjectId}
              onChange={(e) => props.onProjectSelect(e.target.value)}
              disabled={!props.isAuthenticated}
            >
              <option value="">Select project</option>
              {props.projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
          </section>

          <section className="section-card p-3">
            <h3 className="text-sm font-semibold">Search Chats</h3>
            <input
              value={props.recentSearch}
              onChange={(e) => props.onRecentSearchChange(e.target.value)}
              className="text-input mt-2"
              placeholder="Search..."
              disabled={!props.isAuthenticated}
            />
          </section>

          <section className="section-card workspace-recent-list p-2">
            <h3 className="px-2 pt-1 text-sm font-semibold">Recent Chats</h3>
            <div className="mt-2 space-y-2">
              {!props.isAuthenticated ? (
                <p className="muted px-2 text-sm">
                  Login required. <Link to="/login" className="font-semibold text-[var(--primary-strong)]">Sign in</Link>
                </p>
              ) : props.recentChats.length ? (
                props.recentChats.map((chat) => (
                  <button
                    key={chat._id}
                    onClick={() => props.onOpenChat(chat._id)}
                    className="w-full rounded-xl border border-[var(--stroke)] bg-white/70 px-3 py-2 text-left text-sm transition hover:bg-white"
                  >
                    <p className="truncate font-medium">{chat.title}</p>
                    <p className="muted mt-1 truncate text-xs">
                      {chat.project?.name || 'No project'}
                    </p>
                  </button>
                ))
              ) : (
                <p className="muted px-2 text-sm">No chats yet.</p>
              )}
            </div>
          </section>
        </>
      ) : null}
    </aside>
  );
}
