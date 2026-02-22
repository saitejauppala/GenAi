import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import RichMessage from './RichMessage';

type WorkspaceMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  meta?: string;
};

type ChatWorkspaceProps = {
  messages: WorkspaceMessage[];
  prompt: string;
  sending: boolean;
  healthStatus: 'ONLINE' | 'OFFLINE' | 'UNKNOWN';
  healthMessage: string;
  isAuthenticated: boolean;
  onPromptChange: (value: string) => void;
  onSendPrompt: () => void;
  onCopyMessage: (message: WorkspaceMessage) => void;
};

export default function ChatWorkspace(props: ChatWorkspaceProps) {
  const threadRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!threadRef.current || !bottomRef.current) return;
    bottomRef.current.scrollIntoView({ block: 'end' });
  }, [props.messages, props.sending]);

  return (
    <section className="workspace-gem-main">
      <header className="workspace-gem-header">
        <h2>Project Ideas For You</h2>
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
