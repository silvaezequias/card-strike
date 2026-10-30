"use client";

import { Clock, Hash } from "lucide-react";
import { formatTime } from "@/lib/game-helpers";
import { GameEngine } from "@/game/useGameEngine";
import { HUDPanel } from "../ui/hud-panel";

export const MissionStatus = ({ game }: { game: GameEngine }) => {
  const { gameTime, seconds, round } = game.state.countdown;

  return (
    <HUDPanel game={game} title="CRONÔMETRO" icon={<Clock size={12} />}>
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 text-zinc-400 text-xs tracking-widest mb-1">
          <Hash size={10} /> RODADA
        </div>
        <div className="text-4xl font-black text-white bg-zinc-800/50 px-4 py-1 rounded border border-zinc-700 shadow-inner">
          {round}
        </div>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[10px] text-zinc-500 tracking-widest mb-1">
          TEMPO DA RODADA
        </span>
        <div
          className={`text-4xl font-mono ${seconds < 10 ? "text-red-500 animate-pulse" : "text-zinc-200"} drop-shadow-md`}
        >
          {formatTime(seconds)}
        </div>
      </div>

      <div className="text-xs font-mono text-zinc-500">
        TOTAL: {formatTime(gameTime)}
      </div>
    </HUDPanel>
  );
};
