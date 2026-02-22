"use client";

import { ChevronUp, ChevronDown, Ban, Hand } from "lucide-react";
import { InventoryGrid } from "./card";
import { GameEngine } from "@/game/useGameEngine";
import { useGameTheme } from "@/game/useGameTheme";

interface InventoryPanelProps {
  game: GameEngine;
}

export const InventoryPanel = ({ game }: InventoryPanelProps) => {
  const isSelecting = game.state.turnPhase === "PLACING";
  const isOpen = game.state.hud.inventory.isOpen;

  const theme = useGameTheme(game.state.currentTeam);

  const handleToggle = () => {
    game.dispatch({ type: "TOGGLE_INVENTORY" });
  };

  const handleKeepInHand = () => {
    game.dispatch({ type: "KEEP_IN_HAND" });
  };

  const ToggleButton = () => (
    <button
      onClick={handleToggle}
      className={`px-8 py-2 rounded-t-xl border-t border-l border-r flex justify-center
      ${theme.underlay}
      font-bold text-xs tracking-widest shadow-lg flex items-center gap-2 hover:brightness-110 transition-all`}
    >
      INVENTARIO
      {game.state.hud.inventory.isLocked ? (
        <Ban size={14} />
      ) : game.state.hud.inventory.isOpen ? (
        <ChevronDown size={14} />
      ) : (
        <ChevronUp size={14} />
      )}
    </button>
  );

  const KeepInHandButton = () => (
    <button
      onClick={handleKeepInHand}
      className={`px-8 py-2 rounded-t-xl border-t border-l border-r justify-center
      bg-emerald-950 border-emerald-800 text-emerald-400
      
      font-bold text-xs tracking-widest shadow-lg flex items-center gap-2 hover:brightness-110 transition-all`}
    >
      MANTER CARTA(S)
      <Hand size={14} />
    </button>
  );

  return (
    <div
      className={`fixed bottom-0 left-1/2 -translate-x-1/2
      ${isOpen && isSelecting ? "z-[70]" : "z-40"}
      transition-transform duration-500
      ${isOpen ? "translate-y-0" : "translate-y-[calc(100%-40px)]"}`}
    >
      <div className="flex flex-col items-center">
        {isSelecting ? <KeepInHandButton /> : <ToggleButton />}
        <div
          className={`w-[350px] md:w-[500px]
          ${theme.underlay}
          border-t-2 border-x-2 rounded-t-sm shadow-[0_-10px_40px_rgba(0,0,0,0.8)] p-4`}
        >
          <InventoryGrid length={3} game={game} type="hand" />
        </div>
      </div>
    </div>
  );
};
