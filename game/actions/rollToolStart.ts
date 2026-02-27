import { GameState } from "../game-types";

export const ActionRollToolStart = (state: GameState): GameState => ({
  ...state,
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
    isRolling: true,
  },
});
