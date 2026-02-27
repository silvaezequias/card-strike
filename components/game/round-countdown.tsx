"use client";

import { GameEngine } from "@/game/useGameEngine";
import { useGameTheme } from "@/game/useGameTheme";
import { useEffect, useState } from "react";

interface RoundCountdownProps {
  game: GameEngine;
}

export const RoundCountdown = ({ game }: RoundCountdownProps) => {
  const [count, setCount] = useState(3);
  const [phase, setPhase] = useState<"count" | "go" | "done">("count");

  const theme = useGameTheme(game.state.currentTeam);

  useEffect(() => {
    if (phase === "done") return;

    if (phase === "count" && count > 0) {
      const timer = setTimeout(() => setCount((c) => c - 1), 800);
      return () => clearTimeout(timer);
    }

    if (phase === "count" && count === 0) {
      setPhase("go");

      setTimeout(() => {
        setPhase("done");

        game.dispatch({ type: "SELECT_ACTION" });
      }, 700);

      return;
    }
  }, [count, phase]);

  if (phase === "done") return null;

  const glowColor =
    game.state.currentTeam === "faction"
      ? "drop-shadow-[0_0_40px_rgba(239,68,68,0.8)]"
      : "drop-shadow-[0_0_40px_rgba(59,130,246,0.8)]";

  return (
    <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center">
      {/* Round label */}
      <div className="mb-6 flex flex-col items-center gap-2">
        <span className="text-zinc-500 text-xs font-bold tracking-[0.4em] uppercase">
          Preparando
        </span>
        <span
          className={`text-lg font-black tracking-[0.3em] uppercase ${theme.text}`}
        >
          Round {game.state.countdown.round}
        </span>
      </div>

      {/* Counter circle */}
      <div
        className={`relative w-40 h-40 rounded-full border-2 ${theme.border} flex items-center justify-center`}
      >
        {/* Animated ring */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90"
          viewBox="0 0 160 160"
        >
          <circle
            cx="80"
            cy="80"
            r="74"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={theme.text20}
          />
          <circle
            cx="80"
            cy="80"
            r="74"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${(1 - count / 3) * 465} 465`}
            strokeLinecap="round"
            className={`${theme.text} transition-all duration-700 ease-out`}
          />
        </svg>

        {/* Number / GO */}
        <span
          key={phase === "go" ? "go" : count}
          className={`text-7xl font-black ${theme.text} ${glowColor} animate-in zoom-in-50 fade-in duration-300`}
        >
          {phase === "go" ? "GO" : count}
        </span>
      </div>

      {/* Team indicator */}
      <div className="mt-8 flex items-center gap-3">
        <div
          className={`w-2 h-2 rounded-full animate-pulse ${theme.teamBackground}`}
        />
        <span className="text-zinc-400 text-xs font-bold tracking-[0.3em] uppercase">
          Vez de {game.currentTeamName}
        </span>
        <div
          className={`w-2 h-2 rounded-full animate-pulse ${theme.teamBackground}`}
        />
      </div>
    </div>
  );
};
