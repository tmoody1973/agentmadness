"use client";

import { useRef, useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

interface AudioPlayerProps {
  storageId: string | null;
  autoPlay: boolean;
}

export function AudioPlayer({ storageId, autoPlay }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const url = useQuery(
    api.bracket.getAudioUrl,
    storageId ? { storageId: storageId as Id<"_storage"> } : "skip"
  );

  // Load audio src whenever URL is available
  useEffect(() => {
    if (url && audioRef.current) {
      audioRef.current.src = url;
      if (autoPlay) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  }, [url, autoPlay]);

  const togglePlay = () => {
    if (!audioRef.current || !url) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // If ended, restart from beginning
      if (audioRef.current.ended) {
        audioRef.current.currentTime = 0;
      }
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const replay = () => {
    if (!audioRef.current || !url) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Click on progress bar to seek
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * duration;
  };

  if (!storageId) return null;

  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-[#0A0E17] border border-white/5 px-3 py-2">
      <audio
        ref={audioRef}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
        onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Play/Pause */}
      <button
        onClick={togglePlay}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00E5A0] text-[#0A0E17] hover:bg-[#00c98e] transition-colors text-sm font-bold"
        disabled={!url}
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? "⏸" : "▶"}
      </button>

      {/* Progress bar (clickable to seek) */}
      <div
        className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden cursor-pointer"
        onClick={handleSeek}
      >
        <div
          className="h-full bg-[#00E5A0] transition-all duration-100"
          style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%" }}
        />
      </div>

      {/* Time */}
      <span className="text-[10px] text-white/40 font-mono tabular-nums shrink-0">
        {duration > 0 ? `${formatTime(currentTime)}/${formatTime(duration)}` : "—"}
      </span>

      {/* Replay */}
      <button
        onClick={replay}
        className="text-xs text-white/30 hover:text-[#00E5A0] transition-colors shrink-0"
        title="Replay from start"
        disabled={!url}
      >
        ↺
      </button>
    </div>
  );
}
