"use client";

import { useMemo } from "react";
import { MarkdownContent } from "./MarkdownContent";

interface ScoutingReportProps {
  content: string;
}

interface ReportSection {
  title: string;
  icon: string;
  content: string;
}

const SECTION_ICONS: Record<string, string> = {
  "key players": "🏀",
  "team identity": "🎯",
  "playing style": "🎯",
  "recent form": "📈",
  "strengths": "💪",
  "weaknesses": "⚠️",
  "tournament outlook": "🔮",
  "x-factor": "⚡",
  "x factor": "⚡",
};

function getIcon(title: string): string {
  const lower = title.toLowerCase();
  for (const [key, icon] of Object.entries(SECTION_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "📋";
}

function parseReport(content: string): ReportSection[] {
  if (!content) return [];

  const sections: ReportSection[] = [];
  // Split on markdown headers (## or **Header**)
  const lines = content.split("\n");
  let currentTitle = "";
  let currentContent: string[] = [];

  for (const line of lines) {
    // Match ## Header or **Header** at start of line
    const headerMatch = line.match(/^#{1,3}\s+\*?\*?(.+?)\*?\*?\s*$/) ||
                        line.match(/^\*\*(.+?)\*\*\s*$/);

    if (headerMatch) {
      // Save previous section
      if (currentTitle && currentContent.length > 0) {
        sections.push({
          title: currentTitle.replace(/\*\*/g, "").replace(/^#+\s*/, "").trim(),
          icon: getIcon(currentTitle),
          content: currentContent.join("\n").trim(),
        });
      }
      currentTitle = headerMatch[1].replace(/\*\*/g, "").trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentTitle && currentContent.length > 0) {
    sections.push({
      title: currentTitle.replace(/\*\*/g, "").replace(/^#+\s*/, "").trim(),
      icon: getIcon(currentTitle),
      content: currentContent.join("\n").trim(),
    });
  }

  // If no sections found, return the whole content as one section
  if (sections.length === 0 && content.trim()) {
    sections.push({
      title: "Overview",
      icon: "📋",
      content: content.trim(),
    });
  }

  return sections;
}

export function ScoutingReport({ content }: ScoutingReportProps) {
  const sections = useMemo(() => parseReport(content), [content]);

  if (sections.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {sections.map((section, idx) => (
        <details
          key={idx}
          open={idx < 3}
          className="group rounded-lg border border-white/5 bg-[#0A0E17] overflow-hidden"
        >
          <summary className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-white/[0.02] transition-colors select-none list-none">
            <span className="text-base shrink-0">{section.icon}</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-white flex-1">
              {section.title}
            </span>
            <svg
              className="h-3.5 w-3.5 text-white/30 transition-transform group-open:rotate-180 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="px-3 pb-3 border-t border-white/5" style={{ overflowWrap: "break-word" }}>
            <MarkdownContent content={section.content} />
          </div>
        </details>
      ))}
    </div>
  );
}
