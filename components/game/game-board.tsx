"use client";

import { Shield, Crosshair } from "lucide-react";
import BoardTabs from "./board-tabs";
import { GameEngine } from "@/game/useGameEngine";
import { useGameTheme } from "@/game/useGameTheme";

export interface GameBoardProps {
  game: GameEngine;
}

const WarZone = ({ game }: GameBoardProps) => {
  const theme = useGameTheme(game.state.currentTeam);

  return (
    <div className="flex justify-between items-center gap-8 mb-6 relative z-10">
      {/* LEFT WING - POLICE */}
      <div
        className={`flex flex-col gap-3 transform -skew-y-3 origin-right ${theme.slotBg} p-3 rounded-xl border ${theme.orbInner} shadow-lg transition-colors duration-700`}
      >
        {["A", "B", "C"].map((char) => (
          <div
            key={char}
            className={`relative group w-16 h-16 bg-gradient-to-br ${theme.slotItem} rounded-lg border ${theme.orbInner} flex items-center justify-center`}
          >
            {game.state.teams.police.position === char && (
              <div className="absolute inset-0 flex items-center justify-center z-20]">
                <div className="w-10 h-10 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center">
                  <Shield size={20} className="text-white" />
                </div>
              </div>
            )}
            <div className={`text-2xl font-bold ${theme.text}`}>{char}</div>
          </div>
        ))}
      </div>

      {/* Center */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60 clip-octagon flex items-center justify-center border-4 border-slate-600">
          {/* {game.playedCards.map((card: Card, idx: number) => (
            <div
              key={idx}
              className="absolute w-24 h-32 bg-black border rounded-lg shadow-lg flex items-center justify-center"
              style={card.style}
            >
              <div className={`scale-110`}>
                {card.overlayText ? <XCircle size={32} /> : "card.icon"}
              </div>
            </div>
          ))} */}
        </div>
      </div>

      {/* Right Wing */}
      <div
        className={`flex flex-col gap-3 transform skew-y-3 origin-left ${theme.slotBg} p-3 rounded-xl border ${theme.orbInner} shadow-lg`}
      >
        {["A", "B", "C"].map((char) => (
          <div
            key={char}
            className={`relative group w-16 h-16 bg-gradient-to-br ${theme.slotItem} rounded-lg border ${theme.orbInner} flex items-center justify-center`}
          >
            {game.state.teams.faction.position === char && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-20">
                <div className="w-10 h-10 bg-red-600 rounded-full border-2 border-white flex items-center justify-center">
                  <Crosshair size={20} className="text-white" />
                </div>
              </div>
            )}
            <div className={`text-2xl font-bold ${theme.text}`}>{char}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const GameBoard = ({ game }: GameBoardProps) => {
  const theme = useGameTheme(game.state.currentTeam);

  return (
    <div
      className={`relative bg-gradient-to-b ${theme.frameGradient} p-2 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.9)]  ${theme.orbInner} border-b-4 border-black transition-all duration-700`}
    >
      <div
        className={`${theme.innerSurface} rounded-2xl flex flex-col gap-10 p-6 w-[500px] aspect-[3/4] border ${theme.orbInner} shadow-inner transition-colors duration-700`}
      >
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')] rounded-2xl pointer-events-none"></div>
        {game.state.board.warZoneIsActive && <WarZone game={game} />}
        <BoardTabs game={game} />
      </div>
    </div>
  );
};
