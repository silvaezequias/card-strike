"use client";

import type { Card } from "@/lib/types";
import { Portrait } from "@/components/art/noir";
import { GameEngine } from "@/game/useGameEngine";
import { Bombsite } from "@/game/game-types";
import { MAX_HEALTH } from "@/game/card-effects";

export const PlayerCard = ({
  game,
  alignment = "left",
  pendingDamage = 0,
}: {
  game: GameEngine;
  alignment?: "left" | "right";
  /** Dano que a animação ainda não mostrou: a barra cai junto com os impactos. */
  pendingDamage?: number;
}) => {
  const isRight = alignment === "right";
  const cardTeam = isRight ? "faction" : "police";
  const isActive = game.state.currentTeam === cardTeam;

  const { health, position, effects } = game.state.teams[cardTeam];

  return (
    <div
      className={`
        flex flex-col gap-3 p-4
        transform transition-all duration-700 cursor-default
        [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]
        min-w-[220px]
        ${getContainerStyle(isRight)}
        ${!isActive ? "opacity-70 scale-95 grayscale-[0.7]" : ""}
      `}
    >
      <div
        className={`flex items-center gap-4 w-full ${
          isRight ? "flex-row-reverse" : ""
        }`}
      >
        <PlayerAvatar isRight={isRight} position={position} />

        <PlayerInfo
          isRight={isRight}
          teamName={game.teamNames[cardTeam]}
          playerName={game.state.teams[cardTeam].playerName}
          health={health + pendingDamage}
          effects={effects}
        />
      </div>
    </div>
  );
};

const PlayerAvatar = ({
  isRight,
  position,
}: {
  isRight: boolean;
  position: Bombsite | null;
}) => {
  return (
    <div className="relative flex-shrink-0">
      <div
        className={`
          w-16 h-16 rounded-full overflow-hidden border-2
          ${getAvatarStyle(isRight)}
        `}
      >
        <Portrait
          team={isRight ? "faction" : "police"}
          crop="head"
          className={`w-full h-full ${isRight ? "" : "-scale-x-100"}`}
        />
      </div>

      {position && (
        <div
          className={`
            absolute -bottom-1 uppercase
            ${isRight ? "-left-1" : "-right-1"}
            w-5 h-5 border border-white rounded-full
            flex items-center justify-center
            text-[9px] font-bold text-white shadow
            ${isRight ? "bg-red-600" : "bg-blue-600"}
          `}
        >
          {position}
        </div>
      )}
    </div>
  );
};

/* =========================================================
   INFO BLOCK
========================================================= */

const PlayerInfo = ({
  isRight,
  teamName,
  playerName,
  health,
  effects,
}: {
  isRight: boolean;
  teamName: string;
  playerName: string;
  health: number;
  effects: Card[];
}) => {
  return (
    <div
      className={`flex flex-col flex-1 w-full gap-1 ${
        isRight ? "items-end" : ""
      }`}
    >
      <Header
        health={health}
        isRight={isRight}
        teamName={teamName}
        playerName={playerName}
      />

      <HealthBar isRight={isRight} health={health} />

      <ActiveEffects isRight={isRight} effects={effects} />
    </div>
  );
};

/* =========================================================
   HEADER
========================================================= */

const Header = ({
  isRight,
  teamName,
  playerName,
  health,
}: {
  isRight: boolean;
  teamName: string;
  playerName: string;
  health: number;
}) => (
  <>
    <div
      className={`flex items-center gap-2 w-full ${
        isRight ? "flex-row-reverse" : ""
      }`}
    >
      <h3
        className={`font-bold text-sm tracking-wider ${
          isRight ? "text-red-100" : "text-blue-100"
        }`}
      >
        {playerName}
      </h3>

      <span
        className={`
          text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider
          ${isRight ? getRightBadge() : getLeftBadge()}
        `}
      >
        {teamName}
      </span>
    </div>

    <div
      className={`text-slate-400 text-xs font-mono ${
        isRight ? "text-right" : ""
      }`}
    >
      HP: <span className="text-white font-bold">{health}/20</span>
    </div>
  </>
);

/* =========================================================
   HEALTH BAR
========================================================= */

const HealthBar = ({
  isRight,
  health,
}: {
  isRight: boolean;
  health: number;
}) => {
  const isLow = health <= 3;
  const isMid = health <= 6 && health > 3;

  return (
    <div className="relative h-3 w-full overflow-hidden rounded-sm border border-slate-700/40 bg-slate-800/80">
      <div
        className={`h-full transition-all duration-200 ${getHealthColor(isRight, isLow, isMid)} ${
          isLow ? "animate-pulse" : ""
        }`}
        style={{ width: `${(health / MAX_HEALTH) * 100}%` }}
      />

      {/* Divisões internas: uma por ponto de vida */}
      <div className="absolute inset-0 flex">
        {Array.from({ length: MAX_HEALTH }).map((_, i) => (
          <div key={i} className="flex-1 border-r border-black/50 last:border-r-0" />
        ))}
      </div>
    </div>
  );
};

/** Efeitos ativos no time, com os rounds restantes. */
const ActiveEffects = ({
  isRight,
  effects,
}: {
  isRight: boolean;
  effects: Card[];
}) => {
  if (effects.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 text-[10px] font-bold ${isRight ? "justify-end" : ""}`}>
      {effects.map((effect) => (
        <span key={effect.id} className={getUtilityColor(effect.name)}>
          {effect.name} {effect.duration}
        </span>
      ))}
    </div>
  );
};

const getContainerStyle = (isRight: boolean) =>
  isRight ? "border-r-4 border-red-600 " : "border-l-4 border-blue-500 ";

const getAvatarStyle = (isRight: boolean) =>
  isRight
    ? "bg-gradient-to-b from-zinc-700 to-zinc-900 border-red-600/50 shadow-[0_0_10px_rgba(220,38,38,0.4)]"
    : "bg-gradient-to-b from-slate-700 to-slate-900 border-blue-400/50 shadow-[0_0_10px_rgba(59,130,246,0.4)]";

const getRightBadge = () =>
  "bg-red-500/20 text-red-300 border border-red-500/30";

const getLeftBadge = () =>
  "bg-blue-500/20 text-blue-300 border border-blue-500/30";

const getHealthColor = (isRight: boolean, isLow: boolean, isMid: boolean) => {
  if (isRight) {
    if (isLow) return "bg-red-800 shadow-[0_0_4px_rgba(220,38,38,0.6)]";
    if (isMid)
      return "bg-gradient-to-t from-red-700 to-orange-500 shadow-[0_0_4px_rgba(220,38,38,0.4)]";
    return "bg-gradient-to-t from-red-700 to-orange-400 shadow-[0_0_5px_rgba(220,38,38,0.5)]";
  }

  if (isLow) return "bg-red-700 shadow-[0_0_4px_rgba(220,38,38,0.6)]";
  if (isMid)
    return "bg-gradient-to-t from-blue-700 to-blue-400 shadow-[0_0_4px_rgba(59,130,246,0.4)]";

  return "bg-gradient-to-t from-blue-600 to-cyan-400 shadow-[0_0_5px_rgba(34,211,238,0.5)]";
};

const getUtilityColor = (name: string) => {
  switch (name) {
    case "Molotov":
      return "text-orange-500 animate-pulse";
    case "Granada":
      return "text-green-500";
    case "Flashbang":
      return "text-yellow-300";
    case "Smoke":
      return "text-gray-400";
    case "Capacete":
      return "text-sky-400";
    case "Colete":
      return "text-indigo-400";
    default:
      return "text-gray-300";
  }
};
