"use client";

import { Bombsite } from "@/game/game-types";
import { GameEngine } from "@/game/useGameEngine";
import { useGameTheme } from "@/game/useGameTheme";
import { Bomb, AlertTriangle } from "lucide-react";
import { HUDPanel } from "../ui/hud-panel";

export const BombPanel = ({ game }: { game: GameEngine }) => {
  const { maxTime, timer, planted, position } = game.state.bomb;
  const theme = useGameTheme(game.state.currentTeam);

  return (
    <HUDPanel
      title="CARGA C4"
      icon={
        <Bomb
          size={12}
          className={planted ? "text-red-500 animate-bounce" : "text-zinc-600"}
        />
      }
      className={planted ? "aspect-[3.5/4]" : "aspect-square"}
      game={game}
      danger={planted}
    >
      <Display planted={planted} timer={timer} position={position} />
      {planted && (
        <TimerBar planted={planted} timer={timer} maxTime={maxTime} />
      )}
    </HUDPanel>
  );
};

/* ================= HEADER ================= */

const Header = ({ planted }: { planted: boolean }) => (
  <div
    className={`w-full flex justify-between items-center text-[10px] font-bold tracking-widest border-b pb-2
      ${
        planted
          ? "text-red-500 border-red-900/30"
          : "text-zinc-500 border-white/10"
      }`}
  >
    <span>CARGA C4</span>
    <Bomb
      size={14}
      className={planted ? "text-red-500 animate-bounce" : "text-zinc-600"}
    />
  </div>
);

/* ================= DISPLAY ================= */

const Display = ({
  planted,
  timer,
  position,
}: {
  planted: boolean;
  timer: number;
  position: Bombsite | null;
}) => {
  if (!planted) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-zinc-500 font-mono text-sm tracking-widest">
          STATUS: <span className="text-zinc-300 font-bold">SEGURO</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center">
      <div className="relative mb-2">
        <div
          className={`text-7xl font-black font-mono
            ${timer <= 1 ? "text-red-600 animate-ping" : "text-red-500"}
            drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]`}
        >
          {timer.toString().padStart(2, "0")}
        </div>

        <div className="absolute -inset-4 border border-dashed border-red-900/50 rounded-lg animate-pulse" />
      </div>

      <div className="text-xs font-bold text-red-500 tracking-[0.1em] flex items-center gap-1 pt-7 animate-pulse">
        <AlertTriangle size={10} />
        PLANTADA EM
        <span className="bg-red-900/50 text-white text-3xl ml-4 px-1 rounded">
          {position}
        </span>
      </div>
    </div>
  );
};

/* ================= TIMER BAR ================= */

const TimerBar = ({
  planted,
  timer,
  maxTime,
}: {
  planted: boolean;
  timer: number;
  maxTime: number;
}) => {
  const percentage = Math.max(0, Math.min(100, (timer / maxTime) * 100));

  return (
    <div className="w-full h-4 bg-zinc-950 rounded border border-red-900/50 overflow-hidden relative">
      <div
        className={`absolute left-0 top-0 h-full origin-left transition-all duration-500
          bg-[repeating-linear-gradient(45deg,#450a0a,#450a0a_10px,#7f1d1d_10px,#7f1d1d_20px)]
          ${planted ? "animate-pulse" : "opacity-20"}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
