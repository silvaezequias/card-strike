import { useEffect, useRef } from "react";
import { botMove } from "./bot-brain";
import { GameEngine } from "./useGameEngine";

/** Pausa antes de cada jogada, para dar tempo de ver o que o bot faz. */
const THINK_MS = 1100;
const SHAKE_MS = 800;

/** Joga pelo time do bot; não faz nada na vez do humano. */
export const useBot = (game: GameEngine) => {
  const gameRef = useRef(game);
  gameRef.current = game;

  const { state, gameOver } = game;
  const { currentTeam, botTeam, turnPhase, tool, teams, countdown } = state;
  const botTurn = !gameOver && botTeam === currentTeam;

  // Só muda quando o bot tem algo novo a decidir (o relógio não conta).
  const moment = [
    countdown.round,
    currentTeam,
    turnPhase,
    tool.isRolling,
    teams[currentTeam].inventory.hand.length,
  ].join("|");

  useEffect(() => {
    if (!botTurn) return;

    let throwTimer = 0;
    const timer = window.setTimeout(() => {
      const current = gameRef.current;
      const move = botMove(current.state);
      if (move?.type === "dispatch") current.dispatch(move.action);
      if (move?.type !== "roll") return;

      // Como o jogador: balança o dado antes de lançar.
      if (current.state.tool.selected !== "d6") return current.tool.roll();
      current.tool.shakeDice(true);
      throwTimer = window.setTimeout(() => gameRef.current.tool.roll(), SHAKE_MS);
    }, THINK_MS);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(throwTimer);
    };
  }, [botTurn, moment]);
};
