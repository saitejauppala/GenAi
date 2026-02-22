export type GeneratedArtifact = {
  id: string;
  fileName: string;
  language: string;
  content: string;
  sourceMessageId: string;
};

export type MessageSegment =
  | { type: 'text'; text: string }
  | { type: 'code'; language: string; code: string };

const FILE_MARKER_REGEX = /---FILE:\s*([^\n\r]+?)---/g;
const CODE_FENCE_REGEX = /```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g;

function normalizeLanguage(value: string) {
  return value.trim().toLowerCase();
}

function extensionFromLanguage(language: string) {
  const normalized = normalizeLanguage(language);
  if (normalized === 'typescript' || normalized === 'ts') return 'ts';
  if (normalized === 'javascript' || normalized === 'js') return 'js';
  if (normalized === 'python' || normalized === 'py') return 'py';
  if (normalized === 'json') return 'json';
  if (normalized === 'markdown' || normalized === 'md') return 'md';
  if (normalized === 'html') return 'html';
  if (normalized === 'css') return 'css';
  if (normalized === 'bash' || normalized === 'sh' || normalized === 'shell') return 'sh';
  return 'txt';
}

export function inferLanguageFromFileName(fileName: string) {
  const value = fileName.trim().toLowerCase();
  if (value.endsWith('.tsx')) return 'tsx';
  if (value.endsWith('.ts')) return 'typescript';
  if (value.endsWith('.jsx')) return 'jsx';
  if (value.endsWith('.js')) return 'javascript';
  if (value.endsWith('.py')) return 'python';
  if (value.endsWith('.json')) return 'json';
  if (value.endsWith('.md')) return 'markdown';
  if (value.endsWith('.html')) return 'html';
  if (value.endsWith('.css')) return 'css';
  if (value.endsWith('.sh')) return 'bash';
  return 'text';
}

function safeFileName(raw: string, fallback: string) {
  const base = raw.trim();
  if (!base) return fallback;
  return base.replace(/[\\/:*?"<>|]/g, '_');
}

export function parseGeneratedArtifacts(rawText: string, sourceMessageId: string): {
  artifacts: GeneratedArtifact[];
  displayText: string;
} {
  const text = String(rawText || '');
  const markers: Array<{ fileName: string; start: number; end: number }> = [];
  let markerMatch: RegExpExecArray | null = null;
  FILE_MARKER_REGEX.lastIndex = 0;

  while ((markerMatch = FILE_MARKER_REGEX.exec(text)) !== null) {
    markers.push({
      fileName: markerMatch[1]?.trim() || '',
      start: markerMatch.index,
      end: FILE_MARKER_REGEX.lastIndex
    });
  }

  if (markers.length) {
    const artifacts: GeneratedArtifact[] = [];
    for (let i = 0; i < markers.length; i += 1) {
      const current = markers[i];
      const next = markers[i + 1];
      const content = text.slice(current.end, next ? next.start : text.length).trim();
      if (!content) continue;
      const fileName = safeFileName(current.fileName, `file-${i + 1}.txt`);
      artifacts.push({
        id: `${sourceMessageId}-file-${i + 1}`,
        fileName,
        language: inferLanguageFromFileName(fileName),
        content,
        sourceMessageId
      });
    }

    return {
      artifacts,
      displayText: text.replace(/---FILE:\s*[^\n\r]+---\s*/g, '').trim()
    };
  }

  const artifacts: GeneratedArtifact[] = [];
  let codeMatch: RegExpExecArray | null = null;
  let index = 1;
  CODE_FENCE_REGEX.lastIndex = 0;
  while ((codeMatch = CODE_FENCE_REGEX.exec(text)) !== null) {
    const language = normalizeLanguage(codeMatch[1] || '') || 'text';
    const code = String(codeMatch[2] || '').trim();
    if (!code) continue;
    const ext = extensionFromLanguage(language);
    artifacts.push({
      id: `${sourceMessageId}-snippet-${index}`,
      fileName: `snippet-${index}.${ext}`,
      language,
      content: code,
      sourceMessageId
    });
    index += 1;
  }

  return { artifacts, displayText: text.trim() };
}

export function splitMessageSegments(content: string): MessageSegment[] {
  const text = String(content || '');
  const segments: MessageSegment[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null = null;
  const regex = new RegExp(CODE_FENCE_REGEX);

  while ((match = regex.exec(text)) !== null) {
    if (match.index > cursor) {
      segments.push({ type: 'text', text: text.slice(cursor, match.index) });
    }

    segments.push({
      type: 'code',
      language: normalizeLanguage(match[1] || '') || 'text',
      code: String(match[2] || '')
    });

    cursor = regex.lastIndex;
  }

  if (cursor < text.length) {
    segments.push({ type: 'text', text: text.slice(cursor) });
  }

  return segments.length ? segments : [{ type: 'text', text }];
}
