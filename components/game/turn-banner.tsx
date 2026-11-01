"use client";

import { useEffect } from "react";
import { GameEngine } from "@/game/useGameEngine";
import { useGameTheme } from "@/game/useGameTheme";
import { TeamName } from "@/game/game-types";

const TEAM_LABEL: Record<TeamName, string> = {
  police: "DOS POLICIAIS",
  faction: "DOS TERRORISTAS",
};

/** Tempo para a câmera chegar ao novo jogador antes de liberar as ações. */
const TURN_START_MS = 1300;

/**
 * Aviso de novo turno no topo da tela. Aparece uma vez e não bloqueia nada;
 * também é ele que passa da troca de turno para a escolha de ação.
 */
export const TurnBanner = ({ game }: { game: GameEngine }) => {
  const { currentTeam, turnPhase, countdown } = game.state;
  const { dispatch } = game;
  const theme = useGameTheme(currentTeam);

  useEffect(() => {
    if (turnPhase !== "COUNTDOWN") return;
    const timer = window.setTimeout(() => dispatch({ type: "SELECT_ACTION" }), TURN_START_MS);
    return () => window.clearTimeout(timer);
  }, [turnPhase, currentTeam, countdown.round, dispatch]);

  return (
    <div
      key={`${countdown.round}-${currentTeam}`}
      className="turn-banner pointer-events-none fixed inset-x-0 top-9 z-40 flex justify-center"
    >
      <div className="bg-gradient-to-r from-transparent via-black/80 to-transparent px-32 py-2 text-center">
        <p className={`text-2xl font-black uppercase tracking-[0.2em] drop-shadow-lg ${theme.text}`}>
          Agora é a vez {TEAM_LABEL[currentTeam]}
        </p>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-300">
          {game.currentPlayerName}
        </p>
      </div>
    </div>
  );
};
