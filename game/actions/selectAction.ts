import { GameState } from "../game-types";

export const ActionSelectAction = (state: GameState): GameState => ({
  ...state,
  turnPhase: "CHOOSING",
  turnAction: "SELECTING_ACTION",
  tool: {
    ...state.tool,
    selected: null,
  },
  hud: {
    inventory: {
      ...state.hud.inventory,
      isLocked: false,
    },
  },
  board: {
    ...state.board,
    activeTab: "actionTab",
    enabledTabs: {
      actionTab: true,
      battlefieldTab: true,
    },
    warZoneIsActive: true,
  },
});
