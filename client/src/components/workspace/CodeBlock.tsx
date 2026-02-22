import React, { useMemo, useState } from 'react';
import hljs from 'highlight.js/lib/common';

type CodeBlockProps = {
  code: string;
  language?: string;
  className?: string;
};

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default function CodeBlock({ code, language, className = '' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const highlighted = useMemo(() => {
    const text = String(code || '');
    const lang = String(language || '').toLowerCase();
    try {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(text, { language: lang }).value;
      }
      return hljs.highlightAuto(text).value;
    } catch {
      return escapeHtml(text);
    }
  }, [code, language]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1100);
    } catch {
      // ignored
    }
  }

  return (
    <div className={`workspace-code-wrap ${className}`}>
      <div className="workspace-code-head">
        <span className="workspace-code-language">{language || 'text'}</span>
        <button type="button" className="workspace-copy-btn" onClick={copyCode}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="workspace-code-block">
        <code className="hljs" dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}
