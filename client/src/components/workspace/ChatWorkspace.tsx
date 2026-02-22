import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import RichMessage from './RichMessage';

type WorkspaceMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  meta?: string;
};

type ChatWorkspaceProps = {
  filesPanelOpen: boolean;
  messages: WorkspaceMessage[];
  prompt: string;
  sending: boolean;
  healthStatus: 'ONLINE' | 'OFFLINE' | 'UNKNOWN';
  healthMessage: string;
  isAuthenticated: boolean;
  onToggleFilesPanel: () => void;
  onPromptChange: (value: string) => void;
  onSendPrompt: () => void;
  onCopyMessage: (message: WorkspaceMessage) => void;
};

export default function ChatWorkspace(props: ChatWorkspaceProps) {
  const statusClass = useMemo(() => {
    if (props.healthStatus === 'ONLINE') return 'online';
    if (props.healthStatus === 'OFFLINE') return 'offline';
    return 'unknown';
  }, [props.healthStatus]);

  return (
    <section className="workspace-column workspace-chat-column">
      <header className="workspace-chat-topbar">
        <div>
          <p className="workspace-brand-label">DevAI Assistant</p>
          <h2 className="workspace-brand-title">Conversation Workspace</h2>
        </div>
        <div className="workspace-chat-topbar-actions">
          <span className={`workspace-health-chip ${statusClass}`}>{props.healthStatus}</span>
          <button className="btn-secondary" type="button" onClick={props.onToggleFilesPanel}>
            {props.filesPanelOpen ? 'Hide Files' : 'Show Files'}
          </button>
        </div>
      </header>

      {props.healthStatus === 'OFFLINE' ? (
        <div className="workspace-alert rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          AI Server Offline: {props.healthMessage}
        </div>
      ) : null}

      <div className="surface workspace-chat-surface">
        <div className="workspace-chat-scroll">
          <div className="workspace-chat-scroll-inner">
            {props.messages.map((message) => (
              <article
                key={message.id}
                className={`workspace-chat-bubble ${
                  message.role === 'user' ? 'workspace-user-bubble' : 'workspace-assistant-bubble'
                }`}
              >
                <RichMessage content={message.content} />
                {message.meta ? <p className="muted mt-2 text-xs">{message.meta}</p> : null}
                {message.role === 'assistant' ? (
                  <button
                    className="workspace-copy-btn mt-3"
                    type="button"
                    onClick={() => props.onCopyMessage(message)}
                  >
                    Copy Response
                  </button>
                ) : null}
              </article>
            ))}

            {props.sending ? (
              <div className="workspace-typing-indicator">
                <span className="workspace-dot" />
                <span className="workspace-dot" />
                <span className="workspace-dot" />
              </div>
            ) : null}
          </div>
        </div>

        <form
          className="workspace-chat-composer"
          onSubmit={(e) => {
            e.preventDefault();
            props.onSendPrompt();
          }}
        >
          <div className="workspace-chat-composer-inner">
            <textarea
              value={props.prompt}
              onChange={(e) => props.onPromptChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  props.onSendPrompt();
                }
              }}
              placeholder="Describe the app, feature, or file you want to generate..."
              className="workspace-prompt-input"
              disabled={props.sending}
              rows={3}
            />
            <div className="workspace-chat-composer-actions">
              {!props.isAuthenticated ? (
                <p className="muted text-xs sm:text-sm">
                  Guest mode enabled.{' '}
                  <Link to="/login" className="font-semibold text-[var(--primary)]">
                    Login for full generation
                  </Link>
                </p>
              ) : (
                <p className="muted text-xs sm:text-sm">Shift+Enter for new line. Enter to send.</p>
              )}
              <button className="btn-primary min-w-[140px]" disabled={props.sending || !props.prompt.trim()}>
                {props.sending ? 'Generating...' : 'Send'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
