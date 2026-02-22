import React from 'react';
import { WorkspaceMessage } from '../../context/WorkspaceContext';
import ProjectToolbar from './ProjectToolbar';

type Project = {
  _id: string;
  name: string;
};

type ChatWorkspaceProps = {
  projects: Project[];
  activeProjectId: string;
  activeProjectName: string;
  filesPanelOpen: boolean;
  messages: WorkspaceMessage[];
  prompt: string;
  sending: boolean;
  healthStatus: 'ONLINE' | 'OFFLINE' | 'UNKNOWN';
  healthMessage: string;
  isAuthenticated: boolean;
  onProjectSelect: (projectId: string) => void;
  onCreateProject: () => void;
  onDownloadProject: () => void;
  onToggleFilesPanel: () => void;
  onPromptChange: (value: string) => void;
  onSendPrompt: () => void;
  onSaveMessageToProject: (message: WorkspaceMessage) => void;
  onSaveLatestToProject: () => void;
};

export default function ChatWorkspace(props: ChatWorkspaceProps) {
  return (
    <section className="workspace-column workspace-chat-column">
      <div className="workspace-toolbar-sticky">
        <ProjectToolbar
          projects={props.projects}
          activeProjectId={props.activeProjectId}
          activeProjectName={props.activeProjectName}
          filesPanelOpen={props.filesPanelOpen}
          onProjectSelect={props.onProjectSelect}
          onCreateProject={props.onCreateProject}
          onDownloadProject={props.onDownloadProject}
          onToggleFilesPanel={props.onToggleFilesPanel}
        />
      </div>

      {props.healthStatus === 'OFFLINE' ? (
        <div className="workspace-alert rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
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
                  message.role === 'user'
                    ? 'ml-auto bg-[var(--primary)] text-white'
                    : 'border border-[var(--stroke)] bg-white/90'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                {message.meta ? <p className="muted mt-2 text-xs">{message.meta}</p> : null}
                {message.role === 'assistant' && props.isAuthenticated ? (
                  <button
                    className="btn-secondary mt-3 w-full"
                    onClick={() => props.onSaveMessageToProject(message)}
                  >
                    Save to Project
                  </button>
                ) : null}
              </article>
            ))}

            {props.sending ? (
              <div className="workspace-typing-indicator w-fit rounded-xl border border-[var(--stroke)] bg-white px-3 py-2 text-sm">
                AI is typing...
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
            <input
              value={props.prompt}
              onChange={(e) => props.onPromptChange(e.target.value)}
              placeholder="Ask AI to generate code, docs, or files..."
              className="text-input flex-1"
              disabled={props.sending}
            />
            <div className="workspace-chat-composer-actions">
              <button className="btn-primary min-w-[140px]" disabled={props.sending || !props.prompt.trim()}>
                Send Prompt
              </button>
              <button
                type="button"
                className="btn-secondary min-w-[140px]"
                onClick={props.onSaveLatestToProject}
              >
                Save to Project
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
