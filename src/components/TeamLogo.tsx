"use client";

import { ESPN_TEAM_IDS } from "../data/team-logos";
import { useState } from "react";

interface TeamLogoProps {
  teamName: string;
  size?: number; // px, default 24
  className?: string;
}

export function TeamLogo({ teamName, size = 24, className }: TeamLogoProps) {
  const [hasError, setHasError] = useState(false);
  const espnId = ESPN_TEAM_IDS[teamName];

  if (!espnId || hasError) {
    // Fallback: colored circle with first letter
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-white/10 text-white/50 font-bold shrink-0 ${className ?? ""}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {teamName?.charAt(0) ?? "?"}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://a.espncdn.com/i/teamlogos/ncaa/500/${espnId}.png`}
      alt={`${teamName} logo`}
      width={size}
      height={size}
      className={`object-contain shrink-0 ${className ?? ""}`}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
}
