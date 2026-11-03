import { GameState } from "../game-types";
import { closesRound, isFlashed, isGameOver, opponentOf, resolveEndOfTurn } from "../card-effects";

/** Fecha a vez do time atual e passa para o outro. */
const passTurn = (state: GameState): GameState => ({
  ...state,
  ...resolveEndOfTurn(state),
  currentTeam: opponentOf(state.currentTeam),
  boughtThisTurn: false,
  lastResult: null,
  combatEvent: null,
  turnPhase: "COUNTDOWN",
  tool: {
    ...state.tool,
    selected: null,
  },
  countdown: {
    ...state.countdown,
    round: state.countdown.round + (closesRound(state.currentTeam) ? 1 : 0),
    seconds: 60,
  },
  hud: {
    inventory: {
      isOpen: false,
      isLocked: false,
    },
  },
});

/**
 * Fim de turno. Se quem joga a seguir está cego pela Flashbang, a vez dele é
 * perdida na hora, sem passar por ele: conta como uma vez jogada (o efeito
 * acaba, o fogo queima, a bomba conta e a rodada avança) e quem jogou a flash
 * continua.
 */
export const ActionEndTurn = (state: GameState): GameState => {
  const next = passTurn(state);
  if (isGameOver(next) || !isFlashed(next.teams[next.currentTeam])) return next;
  return passTurn(next);
};
