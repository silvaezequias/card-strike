import { GameAction } from "../game-actions";
import { GameState } from "../game-types";

export const ActionSetTool = (
  state: GameState,
  action: GameAction<"SET_TOOL">,
): GameState => ({
  ...state,
  turnPhase: "ACTING",
  turnAction: action.payload === "d6" ? "ROLLING_DICE" : "POSITIONING_ROULETTE",

  hud: {
    inventory: {
      isOpen: false,
      isLocked: true,
    },
  },
  board: {
    ...state.board,
    activeTab: "actionTab",
    enabledTabs: {
      actionTab: true,
      battlefieldTab: false,
    },
  },
  tool: {
    ...state.tool,
    selected: action.payload,
  },
});
