"use client";

interface TournamentToggleProps {
  activeGender: "men" | "women";
  onSelectGender: (gender: "men" | "women") => void;
}

export function TournamentToggle({
  activeGender,
  onSelectGender,
}: TournamentToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#111827] p-1">
      <button
        onClick={() => onSelectGender("men")}
        className={`rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all min-h-[36px] ${
          activeGender === "men"
            ? "bg-[#3B82F6] text-white shadow"
            : "bg-white/5 border border-white/10 text-[#94A3B8] hover:text-white hover:border-white/20"
        }`}
      >
        🏀 Men&apos;s
      </button>
      <button
        onClick={() => onSelectGender("women")}
        className={`rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all min-h-[36px] ${
          activeGender === "women"
            ? "bg-[#A855F7] text-white shadow"
            : "bg-white/5 border border-white/10 text-[#94A3B8] hover:text-white hover:border-white/20"
        }`}
      >
        🏀 Women&apos;s
      </button>
    </div>
  );
}
