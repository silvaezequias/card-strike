"use client";

import { GameEngine } from "@/game/useGameEngine";
import { Layers } from "lucide-react";
import { HUDPanel } from "../ui/hud-panel";
import { NoirCardBack } from "@/components/art/noir-card";

export const DeckPanel = ({
  onDraw,
  game,
  disabled,
}: {
  onDraw: () => void;
  game: GameEngine;
  disabled?: boolean;
}) => {
  const team = game.state.currentTeam;

  const title = team === "faction" ? "BARALHO DO CAOS" : "DECK DE SUPRIMENTOS";

  return (
    <HUDPanel
      game={game}
      icon={<Layers size={12} />}
      title={title}
      className="pb-8"
    >
      <div
        onClick={onDraw}
        className={`relative w-[65%] aspect-[3/4] cursor-pointer group perspective-1000 ${!disabled ? "opacity-50 grayscale pointer-events-none" : ""}`}
      >
        <NoirCardBack
          team={team}
          className="absolute inset-0 w-full h-full translate-x-2 translate-y-3 rotate-[-4deg] scale-95 brightness-50"
        />
        <NoirCardBack
          team={team}
          className="absolute inset-0 w-full h-full translate-x-1 translate-y-1.5 rotate-[-2deg] scale-[0.97] brightness-75"
        />
        <NoirCardBack
          team={team}
          className="absolute inset-0 w-full h-full rotate-[1deg] drop-shadow-[0_10px_18px_rgba(0,0,0,0.7)] group-hover:scale-105 group-hover:rotate-0 transition-transform duration-300"
        />
      </div>
    </HUDPanel>
  );
};
