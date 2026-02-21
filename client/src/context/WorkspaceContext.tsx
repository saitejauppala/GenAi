import React, { createContext, useContext, useMemo, useState } from 'react';

export type WorkspaceMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  fileId?: string;
  projectId?: string;
  fileName?: string;
  meta?: string;
};

export type WorkspaceFile = {
  _id: string;
  fileName: string;
  contentType?: string;
  size?: number;
  preview?: string;
  createdAt?: string;
  filePath?: string;
};

type WorkspaceContextValue = {
  activeProjectId: string;
  setActiveProjectId: React.Dispatch<React.SetStateAction<string>>;
  activeChatId: string | null;
  setActiveChatId: React.Dispatch<React.SetStateAction<string | null>>;
  messages: WorkspaceMessage[];
  setMessages: React.Dispatch<React.SetStateAction<WorkspaceMessage[]>>;
  files: WorkspaceFile[];
  setFiles: React.Dispatch<React.SetStateAction<WorkspaceFile[]>>;
  selectedFileId: string | null;
  setSelectedFileId: React.Dispatch<React.SetStateAction<string | null>>;
  prompt: string;
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  filesPanelOpen: boolean;
  setFilesPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [activeProjectId, setActiveProjectId] = useState('');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WorkspaceMessage[]>([]);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filesPanelOpen, setFilesPanelOpen] = useState(true);

  const value = useMemo(
    () => ({
      activeProjectId,
      setActiveProjectId,
      activeChatId,
      setActiveChatId,
      messages,
      setMessages,
      files,
      setFiles,
      selectedFileId,
      setSelectedFileId,
      prompt,
      setPrompt,
      sidebarCollapsed,
      setSidebarCollapsed,
      filesPanelOpen,
      setFilesPanelOpen
    }),
    [
      activeProjectId,
      activeChatId,
      messages,
      files,
      selectedFileId,
      prompt,
      sidebarCollapsed,
      filesPanelOpen
    ]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used inside WorkspaceProvider');
  }
  return context;
}
