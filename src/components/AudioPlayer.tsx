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
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const url = useQuery(
    api.bracket.getAudioUrl,
    storageId ? { storageId: storageId as Id<"_storage"> } : "skip"
  );

  useEffect(() => {
    if (url && autoPlay && audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [url, autoPlay]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!storageId) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-800/60 px-3 py-2">
      <audio
        ref={audioRef}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
        onTimeUpdate={(e) => setCurrentTime((e.target as HTMLAudioElement).currentTime)}
        onEnded={() => setIsPlaying(false)}
      />
      <button
        onClick={togglePlay}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        disabled={!url}
      >
        {isPlaying ? "⏸" : "▶"}
      </button>

      <div className="flex-1">
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-green-400 transition-all"
            style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%" }}
          />
        </div>
      </div>

      <span className="text-xs text-gray-400 font-mono">
        {duration > 0 ? `${formatTime(currentTime)} / ${formatTime(duration)}` : "—"}
      </span>

      <button
        onClick={toggleMute}
        className="text-sm text-gray-500 hover:text-white transition-colors"
      >
        {isMuted ? "🔇" : "🔊"}
      </button>
    </div>
  );
}
