import React from 'react';
import CodeBlock from './CodeBlock';
import { splitMessageSegments } from '../../lib/aiFormatting';

type RichMessageProps = {
  content: string;
};

export default function RichMessage({ content }: RichMessageProps) {
  const segments = splitMessageSegments(content);

  return (
    <div className="workspace-message-content">
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return (
            <p key={`text-${index}`} className="workspace-message-text">
              {segment.text}
            </p>
          );
        }

        return (
          <CodeBlock
            key={`code-${index}`}
            code={segment.code}
            language={segment.language}
          />
        );
      })}
    </div>
  );
}
