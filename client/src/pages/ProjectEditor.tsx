import React from 'react';
import { useParams } from 'react-router-dom';

export default function ProjectEditor() {
  const { id } = useParams();

  return (
    <div className="page-wrap">
      <div className="page-container space-y-6 fade-up">
        <section className="surface p-6 sm:p-8">
          <span className="pill">Project</span>
          <h1 className="title-lg mt-3">Project Editor</h1>
          <p className="muted mt-2 text-sm sm:text-base">Work on generation logic and app structure.</p>
          <p className="mt-3 break-all text-sm font-medium">Project ID: {id}</p>
        </section>

        <section className="surface grid gap-4 p-4 sm:grid-cols-[1fr_280px] sm:p-6">
          <div className="section-card min-h-[360px] sm:min-h-[460px]">
            <h2 className="text-lg font-semibold">Editor Workspace</h2>
            <p className="muted mt-2 text-sm">
              Editor placeholder. Integrate Monaco or CodeMirror here for full authoring.
            </p>
            <div className="mt-5 h-[260px] rounded-xl border border-dashed border-[var(--stroke)] bg-white/60 sm:h-[350px]" />
          </div>

          <aside className="space-y-4">
            <div className="section-card">
              <h3 className="font-semibold">Context</h3>
              <p className="muted mt-1 text-sm">Attach prompt templates and generation presets.</p>
            </div>
            <div className="section-card">
              <h3 className="font-semibold">Outputs</h3>
              <p className="muted mt-1 text-sm">Store and review generated artifacts for this project.</p>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
