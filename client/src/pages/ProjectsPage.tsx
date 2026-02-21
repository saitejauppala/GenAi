import React, { useEffect, useMemo, useState } from 'react';
import api from '../api';
import WorkspaceLayout from '../components/WorkspaceLayout';

type Project = {
  _id: string;
  name: string;
  description?: string;
};

type SavedFile = {
  _id: string;
  fileName: string;
  contentType: string;
  size: number;
  createdAt: string;
};

function parseDownloadName(disposition?: string) {
  if (!disposition) return null;
  const match = disposition.match(/filename="?([^"]+)"?/i);
  return match?.[1] || null;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [files, setFiles] = useState<SavedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [fileName, setFileName] = useState('notes.md');
  const [fileContent, setFileContent] = useState('');
  const [savingFile, setSavingFile] = useState(false);

  const selectedProject = useMemo(
    () => projects.find((project) => project._id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  async function loadProjects(selectNewest = false) {
    try {
      setError('');
      const { data } = await api.get('/api/projects/list');
      const list = Array.isArray(data) ? data : data?.projects || [];
      setProjects(list);
      if (!list.length) {
        setSelectedProjectId('');
        setFiles([]);
        return;
      }

      if (selectNewest || !list.some((project: Project) => project._id === selectedProjectId)) {
        setSelectedProjectId(list[0]._id);
        await loadProjectFiles(list[0].name);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }

  async function loadProjectFiles(projectNameValue: string) {
    if (!projectNameValue) return;
    try {
      const encodedProjectName = encodeURIComponent(projectNameValue);
      const { data } = await api.get(`/api/files/list/${encodedProjectName}`);
      setFiles(data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load saved files.');
    }
  }

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createProject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!projectName.trim()) return;
    setCreating(true);
    setError('');
    try {
      const { data } = await api.post('/api/projects/create', {
        name: projectName.trim(),
        description: projectDescription.trim()
      });
      setProjectName('');
      setProjectDescription('');
      await loadProjects(true);
      setSelectedProjectId(data._id);
      await loadProjectFiles(data.name);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not create project.');
    } finally {
      setCreating(false);
    }
  }

  async function saveToProject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedProjectId) {
      setError('Select a project first.');
      return;
    }
    if (!fileName.trim()) {
      setError('File name is required.');
      return;
    }
    const projectNameValue = selectedProject?.name;
    if (!projectNameValue) {
      setError('Selected project is invalid.');
      return;
    }
    setSavingFile(true);
    setError('');
    try {
      await api.post('/api/files/save', {
        projectName: projectNameValue,
        fileName,
        content: fileContent,
        contentType: 'text/markdown'
      });
      setFileContent('');
      await loadProjectFiles(projectNameValue);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save file.');
    } finally {
      setSavingFile(false);
    }
  }

  async function downloadFile(projectNameValue: string, fileNameValue: string) {
    const response = await api.get(
      `/api/files/download/${encodeURIComponent(projectNameValue)}/${encodeURIComponent(fileNameValue)}`,
      {
      responseType: 'blob'
      }
    );
    const filename = parseDownloadName(response.headers['content-disposition']) || fileNameValue;
    const blobUrl = URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(blobUrl);
  }

  async function exportZip(projectNameValue: string) {
    const response = await api.post(`/api/files/export/${encodeURIComponent(projectNameValue)}`, undefined, {
      responseType: 'blob'
    });
    const filename =
      parseDownloadName(response.headers['content-disposition']) ||
      `${projectNameValue.replace(/\s+/g, '-').toLowerCase()}.zip`;
    const blobUrl = URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(blobUrl);
  }

  return (
    <WorkspaceLayout
      title="Projects"
      subtitle="Create projects, store generated files, and export project folders as ZIP."
      actions={
        selectedProject ? (
          <button className="btn-primary" onClick={() => exportZip(selectedProject.name)}>
            Export Project Files as ZIP
          </button>
        ) : null
      }
    >
      <div className="grid gap-4 xl:grid-cols-[1.05fr_1fr]">
        <section className="surface p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Create Project</h2>
          <form onSubmit={createProject} className="mt-4 space-y-3">
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="text-input"
              placeholder="Project name"
              required
            />
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              className="text-input min-h-[110px]"
              placeholder="Optional description"
            />
            <button className="btn-primary w-full" disabled={creating}>
              {creating ? 'Creating...' : 'Create Project'}
            </button>
          </form>

          <h3 className="mt-7 text-lg font-semibold">Saved Files View</h3>
          {loading ? (
            <div className="mt-3 space-y-2">
              {[1, 2, 3].map((slot) => (
                <div key={slot} className="h-12 animate-pulse rounded-xl bg-white/75" />
              ))}
            </div>
          ) : projects.length ? (
            <div className="mt-3 space-y-2">
              <select
                value={selectedProjectId}
                onChange={async (e) => {
                  const value = e.target.value;
                  setSelectedProjectId(value);
                  const project = projects.find((item) => item._id === value);
                  await loadProjectFiles(project?.name || '');
                }}
                className="text-input"
              >
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>

              <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
                {files.length ? (
                  files.map((file) => (
                    <article
                      key={file._id}
                      className="section-card flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium">{file.fileName}</p>
                        <p className="muted text-xs">{Math.max(1, Math.round(file.size / 1024))} KB</p>
                      </div>
                      <button
                        onClick={() => selectedProject && downloadFile(selectedProject.name, file.fileName)}
                        className="btn-secondary"
                      >
                        Download File
                      </button>
                    </article>
                  ))
                ) : (
                  <div className="section-card text-center">
                    <p className="muted text-sm">No files saved in this project yet.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="section-card mt-3 text-center">
              <p className="muted text-sm">Create your first project to start saving files.</p>
            </div>
          )}
        </section>

        <section className="surface p-5 sm:p-6">
          <h2 className="text-xl font-semibold">Save to Project</h2>
          <p className="muted mt-1 text-sm">
            Manually save text, code, notes, or reports directly into the selected project folder.
          </p>
          <form onSubmit={saveToProject} className="mt-4 space-y-3">
            <input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="text-input"
              placeholder="filename.md"
              required
            />
            <textarea
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              className="text-input min-h-[310px]"
              placeholder="Generated content to save..."
            />
            <button className="btn-primary w-full" disabled={savingFile || !selectedProjectId}>
              {savingFile ? 'Saving...' : 'Save to Project'}
            </button>
          </form>

          {error ? (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </section>
      </div>
    </WorkspaceLayout>
  );
}
