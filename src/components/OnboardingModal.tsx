"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

const STORAGE_KEY = "agentmadness-onboarded";

interface OnboardingModalProps {
  onDismiss?: () => void;
}

const steps = [
  {
    icon: "🏀",
    title: "Create Your Bracket",
    description: "Sign in to get your own personal tournament. Adjust chaos, seed advantage, and recency settings to shape the simulation.",
  },
  {
    icon: "⚡",
    title: "Simulate Games",
    description: "Hit Simulate Round to watch games resolve one by one, or Simulate All to fill the entire bracket. Choose your speed: Instant, Fast, or Dramatic.",
  },
  {
    icon: "🎙️",
    title: "Hear the Action",
    description: "The AI announcer reads every result with broadcast energy. Click any game for full stats, narrative, and scouting reports.",
  },
  {
    icon: "📊",
    title: "Explore & Compare",
    description: "Click team names for AI scouting reports. Check the Leaderboard for aggregate results. Visit Learn for the full data science breakdown.",
  },
];

export function OnboardingModal({ onDismiss }: OnboardingModalProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show if user hasn't been onboarded
    const onboarded = localStorage.getItem(STORAGE_KEY);
    if (!onboarded) {
      setShow(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setShow(false);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
          />

          {/* Modal */}
          <motion.div
            className="fixed z-[60] inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:w-[480px] md:max-h-[85vh] md:-translate-x-1/2 md:-translate-y-1/2 overflow-y-auto rounded-2xl border border-white/10 bg-[#111827] shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="relative px-6 pt-8 pb-4 text-center">
              <div className="text-4xl mb-3">🏀</div>
              <h2 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight text-white leading-tight">
                Welcome to<br />
                Agent<span className="text-[#00E5A0]">Madness</span>
              </h2>
              <p className="text-sm text-white/40 mt-2">
                AI-powered NCAA Tournament simulator
              </p>
            </div>

            {/* Steps */}
            <div className="px-6 py-4 flex flex-col gap-4">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex gap-4 items-start rounded-xl bg-white/[0.03] border border-white/5 p-4"
                >
                  <div className="text-2xl shrink-0 mt-0.5">{step.icon}</div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wide mb-1">
                      {step.title}
                    </h3>
                    <p className="text-xs text-white/50 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats bar */}
            <div className="px-6 py-3">
              <div className="flex justify-between rounded-xl bg-[#0A0E17] border border-white/5 px-4 py-3">
                {[
                  { value: "136", label: "Teams" },
                  { value: "134", label: "Games" },
                  { value: "~$0.22", label: "Per Run" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-lg font-mono font-bold text-[#00E5A0]">{stat.value}</p>
                    <p className="text-[9px] text-white/30 uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="px-6 pb-8 pt-2">
              <button
                onClick={handleDismiss}
                className="w-full rounded-xl bg-[#00E5A0] text-[#0A0E17] font-extrabold uppercase tracking-wider py-4 text-base hover:bg-[#00c98e] transition-all active:scale-[0.98] min-h-[48px]"
              >
                Get Started →
              </button>
              <p className="text-center text-[10px] text-white/20 mt-3">
                You can always access help from the Learn page
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
