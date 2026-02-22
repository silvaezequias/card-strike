"use client";

import { Shield, Crosshair } from "lucide-react";
import type { Card } from "@/lib/types";
import { GameEngine } from "@/game/useGameEngine";
import { Bombsite } from "@/game/game-types";

export const PlayerCard = ({
  game,
  alignment = "left",
}: {
  game: GameEngine;
  alignment?: "left" | "right";
}) => {
  const isRight = alignment === "right";
  const cardTeam = isRight ? "faction" : "police";
  const isActive = game.state.currentTeam === cardTeam;

  const { health, inventory, position } = game.state.teams[cardTeam];

  return (
    <div
      className={`
        flex flex-col gap-3 p-4 rounded-xl backdrop-blur-md
        transform transition-all duration-700 cursor-default
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
          health={health}
          inventory={inventory}
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
          w-14 h-14 rounded-full flex items-center justify-center border-2
          ${getAvatarStyle(isRight)}
        `}
      >
        {isRight ? (
          <Crosshair className="w-7 h-7 text-red-500" />
        ) : (
          <Shield className="w-7 h-7 text-blue-400" />
        )}
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
  inventory,
}: {
  isRight: boolean;
  teamName: string;
  playerName: string;
  health: number;
  inventory: any;
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

      <UtilitySlots isRight={isRight} warZone={inventory.warZone} />
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
  return (
    <div className="w-full flex gap-[3px]">
      {Array.from({ length: 20 }).map((_, i) => (
        <HealthSegment key={i} index={i} health={health} isRight={isRight} />
      ))}
    </div>
  );
};

const HealthSegment = ({
  index,
  health,
  isRight,
}: {
  index: number;
  health: number;
  isRight: boolean;
}) => {
  const isFilled = index < health;
  const isLow = health <= 3;
  const isMid = health <= 6 && health > 3;

  const filledClass = getHealthColor(isRight, isLow, isMid);

  return (
    <div
      className={`
        h-3 flex-1 rounded-sm transition-all duration-500
        ${isFilled ? filledClass : "bg-slate-800/80 border border-slate-700/40"}
        ${isLow && isFilled ? "animate-pulse" : ""}
      `}
    />
  );
};

/* =========================================================
   UTILITY SLOTS
========================================================= */

const UtilitySlots = ({
  isRight,
  warZone,
}: {
  isRight: boolean;
  warZone: (Card | null)[];
}) => {
  return (
    <div className={`flex gap-1 mt-1 ${isRight ? "flex-row-reverse" : ""}`}>
      {Array.from({ length: 6 }).map((_, i) => (
        <UtilitySlot key={i} card={warZone[i]} />
      ))}
    </div>
  );
};

const UtilitySlot = ({ card }: { card?: Card | null }) => {
  return (
    <div className="w-5 h-5 bg-slate-800 border border-slate-600 rounded flex items-center justify-center relative overflow-hidden">
      {card && (
        <div className={`scale-[0.6] ${getUtilityColor(card.name)}`}>
          {card.name}
        </div>
      )}
    </div>
  );
};

const getContainerStyle = (isRight: boolean) =>
  isRight
    ? "bg-zinc-900/90 border-r-4 border-red-600 "
    : "bg-slate-900/90 border-l-4 border-blue-500 ";

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
