import React from 'react';
import CodeBlock from './CodeBlock';
import { GeneratedArtifact } from '../../lib/aiFormatting';

type ProjectFilePanelProps = {
  isOpen: boolean;
  artifacts: GeneratedArtifact[];
  selectedArtifactId: string | null;
  onSelectArtifact: (artifactId: string) => void;
  onCopyArtifact: (artifact: GeneratedArtifact) => void;
};

export default function ProjectFilePanel(props: ProjectFilePanelProps) {
  if (!props.isOpen) return null;

  const selected =
    props.artifacts.find((artifact) => artifact.id === props.selectedArtifactId) ||
    props.artifacts[0] ||
    null;

  return (
    <aside className="workspace-column workspace-file-column">
      <div className="section-card p-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Generated Files</h3>
          <span className="workspace-file-count">{props.artifacts.length}</span>
        </div>
        <p className="muted mt-1 text-xs">Files extracted from AI responses.</p>
      </div>

      <div className="surface workspace-file-list">
        <div className="space-y-2">
          {props.artifacts.length ? (
            props.artifacts.map((artifact) => (
              <button
                key={artifact.id}
                onClick={() => props.onSelectArtifact(artifact.id)}
                className={`workspace-file-item ${
                  props.selectedArtifactId === artifact.id ? 'active' : ''
                }`}
              >
                <p className="truncate font-medium">{artifact.fileName}</p>
                <p className="muted mt-1 text-xs">{artifact.language}</p>
              </button>
            ))
          ) : (
            <p className="muted text-sm">Ask AI to generate files. They will appear here automatically.</p>
          )}
        </div>
      </div>

      <div className="surface workspace-file-preview">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold">{selected?.fileName || 'File Preview'}</h4>
          {selected ? (
            <button className="workspace-copy-btn" onClick={() => props.onCopyArtifact(selected)}>
              Copy File
            </button>
          ) : null}
        </div>

        {selected ? (
          <CodeBlock code={selected.content} language={selected.language} className="workspace-file-code" />
        ) : (
          <p className="muted text-sm">No file selected.</p>
        )}
      </div>
    </aside>
  );
}
