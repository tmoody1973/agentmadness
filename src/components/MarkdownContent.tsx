"use client";

import ReactMarkdown from "react-markdown";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={`prose-dark ${className ?? ""}`}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h3 className="text-sm font-bold text-white mt-3 mb-1">{children}</h3>
          ),
          h2: ({ children }) => (
            <h4 className="text-xs font-bold text-white mt-2 mb-1">{children}</h4>
          ),
          h3: ({ children }) => (
            <h5 className="text-xs font-semibold text-white mt-2 mb-1">{children}</h5>
          ),
          p: ({ children }) => (
            <p className="text-[11px] text-[#C8CED6] leading-relaxed mb-2 last:mb-0">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="text-[11px] text-[#C8CED6] leading-relaxed space-y-1 mb-2 pl-3 list-disc list-outside">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="text-[11px] text-[#C8CED6] leading-relaxed space-y-1 mb-2 pl-3 list-decimal list-outside">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-[11px] text-[#C8CED6]">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="text-white font-semibold">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="text-[#94A3B8] italic">{children}</em>
          ),
          a: ({ children, href }) => (
            <a href={href} className="text-[#00E5A0] hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2">
              <table className="w-full text-[10px] border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-white/10">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="text-left px-2 py-1 text-[#94A3B8] font-semibold uppercase tracking-wider">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-2 py-1 text-[#C8CED6] border-b border-white/5">{children}</td>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[#00E5A0]/50 pl-3 my-2 text-[11px] text-[#94A3B8] italic">{children}</blockquote>
          ),
          code: ({ children }) => (
            <code className="text-[10px] bg-white/5 rounded px-1 py-0.5 text-[#FFB800] font-mono">{children}</code>
          ),
          hr: () => (
            <hr className="border-white/10 my-2" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
