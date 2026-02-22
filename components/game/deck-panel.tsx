"use client";

import { GameEngine } from "@/game/useGameEngine";
import { useGameTheme } from "@/game/useGameTheme";
import { Shield, Crosshair, Layers, SquarePlus } from "lucide-react";
import { HUDPanel } from "../ui/hud-panel";

export const DeckPanel = ({
  onDraw,
  game,
  disabled,
}: {
  onDraw: () => void;
  game: GameEngine;
  disabled?: boolean;
}) => {
  const theme = useGameTheme(game.state.currentTeam);

  const title =
    game.state.currentTeam === "faction"
      ? "BARALHO DO CAOS"
      : "DECK DE SUPRIMENTOS";

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
        <div
          className={`
              absolute inset-0
              ${theme.underlay}
              rounded-lg
              border
              transform
              translate-x-2 translate-y-3
              rotate-[-2deg]
              scale-95
              shadow-md
            `}
        />
        <div
          className={`
              absolute inset-0
              ${theme.underlay}
              rounded-lg
              border
              transform
              translate-x-1 translate-y-1.5
              rotate-[-3deg]
              scale-[0.97]
              shadow-lg
          `}
        />

        <div
          className={`
              group
              absolute inset-0
              ${theme.underlay}
              rounded-lg
              border
              transform
              translate-x-1 translate-y-1.5
              rotate-[1deg]
              scale-[0.97]
              shadow-lg
              flex
              justify-center
              items-center
              group-hover:scale-110
              group-hover:rotate-0
              transition-all
              duration-300
            `}
        >
          {game.state.currentTeam === "faction" ? (
            <Crosshair
              className={`w-10 h-10 group-hover:hidden ${theme.text}`}
            />
          ) : (
            <Shield className={`w-10 h-10 group-hover:hidden ${theme.text}`} />
          )}
          <SquarePlus
            className={`w-10 h-10 hidden group-hover:block ${theme.text}`}
          />
        </div>
      </div>
    </HUDPanel>
  );
};
