import { GameState } from "../game-types";
import { opponentOf, resolveEndOfTurn } from "../card-effects";

export const ActionEndTurn = (state: GameState): GameState => ({
  ...state,
  ...resolveEndOfTurn(state),
  currentTeam: opponentOf(state.currentTeam),
  lastResult: null,
  combatEvent: null,
  turnPhase: "COUNTDOWN",
  tool: {
    ...state.tool,
    selected: null,
  },
  countdown: {
    ...state.countdown,
    round: state.countdown.round + 1,
    seconds: 60,
  },
  hud: {
    inventory: {
      isOpen: false,
      isLocked: false,
    },
  },
});
