import { GameState } from "../game-types";

export const ActionEndTurn = (state: GameState): GameState => ({
  ...state,
  currentTeam: state.currentTeam === "faction" ? "police" : "faction",
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
