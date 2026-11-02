import { GameState } from "../game-types";
import { isFlashed } from "../card-effects";
import { FLASH_BLIND_SECONDS } from "../card-fx";

const skipFlashedTurn = (state: GameState): GameState => ({
  ...state,
  turnPhase: "IDLE",
  turnAction: "NONE",
  lastResult: "CEGO PELA FLASHBANG: PERDEU A VEZ",
  countdown: {
    ...state.countdown,
    seconds: FLASH_BLIND_SECONDS,
  },
  board: {
    ...state.board,
    activeTab: "battlefieldTab",
    enabledTabs: {
      actionTab: false,
      battlefieldTab: true,
    },
  },
});

const chooseAction = (state: GameState): GameState => ({
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

export const ActionSelectAction = (state: GameState): GameState =>
  isFlashed(state.teams[state.currentTeam])
    ? skipFlashedTurn(state)
    : chooseAction(state);
