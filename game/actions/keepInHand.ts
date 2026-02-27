import { GameState } from "../game-types";

export const ActionKeepInHand = (state: GameState): GameState => ({
  ...state,
  turnPhase: "IDLE",
  turnAction: "NONE",
  countdown: {
    ...state.countdown,
    seconds: 3,
  },
  hud: {
    inventory: {
      ...state.hud.inventory,
      isOpen: false,
      isLocked: false,
    },
  },
  board: {
    ...state.board,
    activeTab: "battlefieldTab",
    enabledTabs: {
      actionTab: false,
      battlefieldTab: true,
    },
    warZoneIsActive: true,
  },
});
