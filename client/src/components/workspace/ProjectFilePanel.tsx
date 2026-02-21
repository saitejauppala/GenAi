import React from 'react';
import { WorkspaceFile } from '../../context/WorkspaceContext';

type ProjectFilePanelProps = {
  isOpen: boolean;
  projects: Array<{ _id: string; name: string }>;
  activeProjectId: string;
  activeProjectName: string;
  files: WorkspaceFile[];
  selectedFileId: string | null;
  onProjectSelect: (projectId: string) => void;
  onSelectFile: (fileId: string) => void;
  onDownloadFile: (file: WorkspaceFile) => void;
  onDownloadProject: () => void;
};

export default function ProjectFilePanel(props: ProjectFilePanelProps) {
  if (!props.isOpen) return null;

  const selected = props.files.find((file) => file._id === props.selectedFileId) || null;

  return (
    <aside className="workspace-column workspace-file-column">
      <div className="section-card p-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Project File Explorer</h3>
          <button className="btn-secondary" onClick={props.onDownloadProject} disabled={!props.activeProjectName}>
            ZIP
          </button>
        </div>
        <p className="muted mt-1 text-xs">{props.activeProjectName || 'No project selected'}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {props.projects.map((project) => (
            <button
              key={project._id}
              className={`rounded-lg border px-2 py-1 text-xs ${
                props.activeProjectId === project._id
                  ? 'border-[var(--primary)] bg-emerald-50/70'
                  : 'border-[var(--stroke)] bg-white/70'
              }`}
              onClick={() => props.onProjectSelect(project._id)}
            >
              {project.name}
            </button>
          ))}
        </div>
      </div>

      <div className="surface workspace-file-list">
        <div className="space-y-2">
          {props.files.length ? (
            props.files.map((file) => (
              <button
                key={file._id}
                onClick={() => props.onSelectFile(file._id)}
                className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                  props.selectedFileId === file._id
                    ? 'border-[var(--primary)] bg-emerald-50/70'
                    : 'border-[var(--stroke)] bg-white/70'
                }`}
              >
                <p className="truncate font-medium">{file.fileName}</p>
                <p className="muted mt-1 text-xs">{Math.max(1, Math.round((file.size || 1) / 1024))} KB</p>
              </button>
            ))
          ) : (
            <p className="muted text-sm">No files generated yet.</p>
          )}
        </div>
      </div>

      <div className="surface workspace-file-preview">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold">{selected?.fileName || 'File Preview'}</h4>
          {selected ? (
            <button className="btn-secondary" onClick={() => props.onDownloadFile(selected)}>
              Download
            </button>
          ) : null}
        </div>
        <pre className="workspace-preview-content">{selected?.preview || 'Select a file to preview.'}</pre>
      </div>
    </aside>
  );
}
