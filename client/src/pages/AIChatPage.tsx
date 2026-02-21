import React, { useEffect, useMemo, useState } from 'react';
import api from '../api';
import ChatSidebar from '../components/workspace/ChatSidebar';
import ChatWorkspace from '../components/workspace/ChatWorkspace';
import ProjectFilePanel from '../components/workspace/ProjectFilePanel';
import {
  WorkspaceFile,
  WorkspaceMessage,
  WorkspaceProvider,
  useWorkspace
} from '../context/WorkspaceContext';

type RecentChat = {
  _id: string;
  title: string;
  updatedAt: string;
  project?: { _id: string; name: string } | null;
};

type Project = {
  _id: string;
  name: string;
  description?: string;
};

type HealthState = {
  status: 'ONLINE' | 'OFFLINE' | 'UNKNOWN';
  checkedAt: string | null;
  message: string;
};

function parseDownloadName(disposition?: string) {
  if (!disposition) return null;
  const match = disposition.match(/filename="?([^"]+)"?/i);
  return match?.[1] || null;
}

function guestPreview(prompt: string) {
  const text = prompt.trim() || 'your idea';
  return [
    `Blueprint for "${text.slice(0, 50)}":`,
    '- Define MVP scope and user journeys.',
    '- Create backend modules for auth, projects, files, and AI routes.',
    '- Build a 3-column workspace UI and project explorer.',
    '- Save generated files to /projects/{projectName}/.',
    '',
    'Login to run full remote-AI generation.'
  ].join('\n');
}

function WorkspaceView() {
  const {
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
  } = useWorkspace();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(localStorage.getItem('token')));
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
  const [recentSearch, setRecentSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [health, setHealth] = useState<HealthState>({
    status: 'UNKNOWN',
    checkedAt: null,
    message: 'Checking AI health...'
  });

  const activeProject = useMemo(
    () => projects.find((project) => project._id === activeProjectId) || null,
    [projects, activeProjectId]
  );

  useEffect(() => {
    if (!messages.length) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content:
            'Workspace initialized. Select a project and ask AI to generate code or documents.\n' +
            'Generated files will appear in the right-side Project File Explorer.'
        }
      ]);
    }
  }, [messages.length, setMessages]);

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

        const [projectResp, chatResp] = await Promise.all([
          api.get('/api/projects/list'),
          api.get('/api/ai/chats')
        ]);
        if (!mounted) return;

        const loadedProjects = Array.isArray(projectResp.data)
          ? projectResp.data
          : projectResp.data?.projects || [];
        setProjects(loadedProjects);
        setRecentChats(chatResp.data || []);

        if (!activeProjectId && loadedProjects[0]) {
          setActiveProjectId(loadedProjects[0]._id);
        }
      } catch {
        if (mounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setCheckingAuth(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [activeProjectId, setActiveProjectId]);

  useEffect(() => {
    if (!activeProjectId) {
      setFiles([]);
      setSelectedFileId(null);
      return;
    }
    refreshFiles(activeProjectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProjectId]);

  useEffect(() => {
    let active = true;
    async function pollHealth(force = false) {
      try {
        const response = force ? await api.post('/api/ai/health-check') : await api.get('/api/ai/health-check');
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

  async function refreshRecentChats(search = '') {
    if (!isAuthenticated) return;
    const { data } = await api.get('/api/ai/chats', { params: { search } });
    setRecentChats(data || []);
  }

  async function handleProjectSelect(projectId: string) {
    setActiveProjectId(projectId);
    if (!projectId) return;

    const related = recentChats.find((chat) => chat.project?._id === projectId);
    if (related) {
      await openChat(related._id);
    } else {
      setActiveChatId(null);
      setMessages([
        {
          id: `project-switch-${Date.now()}`,
          role: 'assistant',
          content: 'Project switched. Start a new chat for this project.'
        }
      ]);
    }
  }

  async function refreshFiles(projectId: string) {
    const project = projects.find((item) => item._id === projectId);
    if (!project) return;
    const encodedProjectName = encodeURIComponent(project.name);
    const { data } = await api.get(`/api/files/list/${encodedProjectName}`);
    const loaded = data || [];
    setFiles(loaded);
    if (!loaded.length) {
      setSelectedFileId(null);
      return;
    }
    if (!selectedFileId || !loaded.some((file: WorkspaceFile) => file._id === selectedFileId)) {
      setSelectedFileId(loaded[0]._id);
      await loadFilePreview(loaded[0]._id);
    }
  }

  async function loadFilePreview(fileId: string) {
    if (!activeProjectId) return;
    const { data } = await api.get(`/api/projects/${activeProjectId}/files/${fileId}`);
    setFiles((prev) =>
      prev.map((file) =>
        file._id === fileId
          ? { ...file, preview: data?.preview || '', filePath: data?.filePath || file.filePath }
          : file
      )
    );
  }

  async function openChat(chatId: string) {
    if (!isAuthenticated) return;
    const { data } = await api.get(`/api/ai/chats/${chatId}`);
    const parsedMessages: WorkspaceMessage[] = (data?.messages || []).map((item: any, index: number) => ({
      id: `${chatId}-${index}`,
      role: item.role,
      content: item.content,
      fileId: item.fileId
    }));
    setMessages(
      parsedMessages.length
        ? parsedMessages
        : [{ id: 'empty-chat', role: 'assistant', content: 'No messages in this chat yet.' }]
    );
    setActiveChatId(data._id);

    const chatProjectId = data?.project?._id || data?.associatedProject?._id || data?.project || '';
    if (chatProjectId) {
      setActiveProjectId(chatProjectId);
    }
  }

  function startNewChat() {
    setActiveChatId(null);
    setMessages([
      { id: `new-chat-${Date.now()}`, role: 'assistant', content: 'New chat started. Enter your prompt.' }
    ]);
  }

  async function createProject() {
    const name = window.prompt('Project name');
    if (!name?.trim()) return;
    const description = window.prompt('Project description (optional)') || '';
    const { data } = await api.post('/api/projects/create', { name: name.trim(), description });
    setProjects((prev) => [data, ...prev]);
    setActiveProjectId(data._id);
    await refreshFiles(data._id);
  }

  async function downloadProject() {
    if (!activeProject?.name) return;
    const encodedProjectName = encodeURIComponent(activeProject.name);
    const response = await api.post(`/api/files/export/${encodedProjectName}`, undefined, {
      responseType: 'blob'
    });
    const filename =
      parseDownloadName(response.headers['content-disposition']) ||
      `${activeProject.name.replace(/\s+/g, '-').toLowerCase()}.zip`;
    const blobUrl = URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(blobUrl);
  }

  async function downloadFile(file: WorkspaceFile) {
    if (!activeProject?.name) return;
    const response = await api.get(
      `/api/files/download/${encodeURIComponent(activeProject.name)}/${encodeURIComponent(file.fileName)}`,
      { responseType: 'blob' }
    );
    const filename = parseDownloadName(response.headers['content-disposition']) || file.fileName;
    const blobUrl = URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(blobUrl);
  }

  async function saveMessageToProject(message: WorkspaceMessage) {
    if (!activeProject?.name) return;
    await api.post('/api/files/save', {
      projectName: activeProject.name,
      fileName: `manual-${Date.now()}.md`,
      content: message.content,
      contentType: 'text/markdown'
    });
    await refreshFiles(activeProject._id);
  }

  async function saveLatestAssistantToProject() {
    const latestAssistant = [...messages].reverse().find((item) => item.role === 'assistant');
    if (!latestAssistant) return;
    await saveMessageToProject(latestAssistant);
  }

  async function sendPrompt() {
    const input = prompt.trim();
    if (!input || sending) return;
    setPrompt('');

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', content: input }]);

    if (!isAuthenticated) {
      setMessages((prev) => [
        ...prev,
        { id: `g-${Date.now()}`, role: 'assistant', content: guestPreview(input), meta: 'Guest preview' }
      ]);
      return;
    }

    if (health.status === 'OFFLINE') {
      setMessages((prev) => [
        ...prev,
        {
          id: `offline-${Date.now()}`,
          role: 'assistant',
          content: 'AI Server Offline. Please retry once the tunnel and Ollama server are online.'
        }
      ]);
      return;
    }

    setSending(true);
    try {
      const { data } = await api.post('/api/ai/generate', {
        prompt: input,
        chatId: activeChatId || undefined,
        projectId: activeProjectId || undefined,
        saveToProject: Boolean(activeProjectId),
        fileName: 'generated-output.md'
      });

      const assistantId = `a-${Date.now()}`;
      const text = String(data?.text || 'No response received.');
      setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

      for (let i = 1; i <= text.length; i += 5) {
        const chunk = text.slice(0, i);
        setMessages((prev) => prev.map((item) => (item.id === assistantId ? { ...item, content: chunk } : item)));
        // typing animation
        await new Promise((resolve) => setTimeout(resolve, 12));
      }

      const firstSaved = data?.savedFiles?.[0] || data?.savedFile;
      setMessages((prev) =>
        prev.map((item) =>
          item.id === assistantId
            ? {
                ...item,
                content: text,
                meta: `${data?.model || 'ollama'} - ${data?.tokensUsed || 0} tokens`,
                fileId: firstSaved?.id,
                projectId: firstSaved?.projectId,
                fileName: firstSaved?.fileName
              }
            : item
        )
      );

      setActiveChatId(data.chatId || null);
      await refreshRecentChats(recentSearch);
      if (activeProjectId) await refreshFiles(activeProjectId);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, role: 'assistant', content: err?.response?.data?.message || 'AI request failed.' }
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="workspace-root page-wrap">
      <div className="page-container workspace-ide-layout">
        <ChatSidebar
          isCollapsed={sidebarCollapsed}
          isAuthenticated={isAuthenticated}
          projects={projects}
          activeProjectId={activeProjectId}
          recentChats={recentChats}
          recentSearch={recentSearch}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
          onStartNewChat={startNewChat}
          onRecentSearchChange={async (value) => {
            setRecentSearch(value);
            await refreshRecentChats(value);
          }}
          onOpenChat={openChat}
          onProjectSelect={handleProjectSelect}
        />

        <ChatWorkspace
          projects={projects}
          activeProjectId={activeProjectId}
          activeProjectName={activeProject?.name || ''}
          filesPanelOpen={filesPanelOpen}
          messages={messages}
          prompt={prompt}
          sending={sending}
          healthStatus={health.status}
          healthMessage={health.message}
          isAuthenticated={isAuthenticated && !checkingAuth}
          onProjectSelect={handleProjectSelect}
          onCreateProject={createProject}
          onDownloadProject={downloadProject}
          onToggleFilesPanel={() => setFilesPanelOpen((prev) => !prev)}
          onPromptChange={setPrompt}
          onSendPrompt={sendPrompt}
          onSaveMessageToProject={saveMessageToProject}
          onSaveLatestToProject={saveLatestAssistantToProject}
        />

        <ProjectFilePanel
          isOpen={filesPanelOpen}
          projects={projects}
          activeProjectId={activeProjectId}
          activeProjectName={activeProject?.name || ''}
          files={files}
          selectedFileId={selectedFileId}
          onProjectSelect={handleProjectSelect}
          onSelectFile={async (fileId) => {
            setSelectedFileId(fileId);
            await loadFilePreview(fileId);
          }}
          onDownloadFile={downloadFile}
          onDownloadProject={downloadProject}
        />
      </div>
    </div>
  );
}

export default function AIChatPage() {
  return (
    <WorkspaceProvider>
      <WorkspaceView />
    </WorkspaceProvider>
  );
}
