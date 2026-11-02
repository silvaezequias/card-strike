import { GameState } from "../game-types";
import { closesRound, opponentOf, resolveEndOfTurn } from "../card-effects";

export const ActionEndTurn = (state: GameState): GameState => ({
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
