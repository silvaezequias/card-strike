"use client";

import { ChevronUp, ChevronDown, Ban, Hand } from "lucide-react";
import { InventoryGrid } from "./card";
import { GameEngine } from "@/game/useGameEngine";
import { useGameTheme } from "@/game/useGameTheme";
import { useGate } from "./tutorial-gate";
import { TeamName } from "@/game/game-types";

interface InventoryPanelProps {
  game: GameEngine;
  /** Tutorial: mostra o inventário aberto e destacado, sem mudar o jogo. */
  spotlight?: boolean;
  /** Mantém a mão fechada até a câmera chegar aos slots. */
  waitCamera?: boolean;
  /** Abre a mão sem mudar o jogo (distribuição inicial das cartas). */
  peek?: boolean;
  /** Mão mostrada; sem ele, a do time da vez. */
  team?: TeamName;
}

export const InventoryPanel = ({
  game,
  spotlight = false,
  waitCamera = false,
  peek = false,
  team,
}: InventoryPanelProps) => {
  const isSelecting = game.state.turnPhase === "PLACING";
  const isOpen = (game.state.hud.inventory.isOpen && !waitCamera) || spotlight || peek;

  const theme = useGameTheme(game.state.currentTeam);
  const inventoryGate = useGate("inventory");
  const keepGate = useGate("keep");

  const handleToggle = () => {
    if (!inventoryGate.allowed) return;
    game.dispatch({ type: "TOGGLE_INVENTORY" });
  };

  const handleKeepInHand = () => {
    if (!keepGate.allowed) return;
    game.dispatch({ type: "KEEP_IN_HAND" });
  };

  const ToggleButton = () => (
    <button
      onClick={handleToggle}
      className={`px-8 py-2 rounded-t-xl border-t border-l border-r flex justify-center
      ${theme.hudPanel}
      font-bold text-xs tracking-widest flex items-center gap-2 hover:brightness-110 transition-all`}
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
      // Mesma escala do palco (--fit); origem à esquerda mantém o -50% centralizado.
      style={{ scale: "var(--fit, 1)", transformOrigin: "left bottom" }}
      className={`fixed bottom-0 left-1/2 -translate-x-1/2
      ${isOpen && isSelecting ? "z-[70]" : "z-40"}
      transition-transform duration-500
      ${isOpen ? "translate-y-0" : "translate-y-[calc(100%-40px)]"}`}
    >
      <div className="flex flex-col items-center">
        {isSelecting ? keepGate.allowed ? <KeepInHandButton /> : <div className="h-8" /> : <ToggleButton />}
        <div
          data-hand-anchor
          className={`${spotlight ? "tutorial-highlight" : ""} w-[350px] md:w-[500px]
          ${theme.hudPanel}
          border-t-2 border-x-2 rounded-t-sm p-4`}
        >
          <InventoryGrid length={3} game={game} type="hand" team={team} />
        </div>
      </div>
    </div>
  );
};
