import React from 'react';

type Project = {
  _id: string;
  name: string;
};

type ProjectToolbarProps = {
  projects: Project[];
  activeProjectId: string;
  activeProjectName: string;
  filesPanelOpen: boolean;
  onProjectSelect: (projectId: string) => void;
  onCreateProject: () => void;
  onDownloadProject: () => void;
  onToggleFilesPanel: () => void;
};

export default function ProjectToolbar(props: ProjectToolbarProps) {
  return (
    <div className="section-card workspace-project-toolbar">
      <div className="flex flex-wrap items-center gap-2">
        <span className="pill">Active Project</span>
        <span className="font-semibold">{props.activeProjectName || 'None selected'}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={props.activeProjectId}
          onChange={(e) => props.onProjectSelect(e.target.value)}
          className="text-input min-w-[220px]"
        >
          <option value="">Select project</option>
          {props.projects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.name}
            </option>
          ))}
        </select>
        <button className="btn-secondary" onClick={props.onCreateProject}>
          Create Project
        </button>
        <button className="btn-secondary" onClick={props.onDownloadProject} disabled={!props.activeProjectId}>
          Download Project
        </button>
        <button className="btn-secondary" onClick={props.onToggleFilesPanel}>
          {props.filesPanelOpen ? 'Hide Files Panel' : 'Open Files Panel'}
        </button>
      </div>
    </div>
  );
}
