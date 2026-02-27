import { GameAction } from "../game-actions";
import { GameState } from "../game-types";

export const ActionRollToolComplete = (
  state: GameState,
  action: GameAction<"ROLL_TOOL_COMPLETE">,
): GameState => {
  const isD6 = state.tool.selected === "d6";
  const { hand: handInventory } = state.teams[state.currentTeam].inventory;

  return {
    ...state,
    turnPhase: isD6
      ? handInventory.length < 3
        ? "BUYING"
        : "PLACING"
      : "IDLE",
    turnAction: "NONE",

    hud: {
      inventory: {
        isOpen: isD6,
        isLocked: isD6,
      },
    },
    tool: {
      ...state.tool,
      selected: null,
      isRolling: false,
      result: action.payload,
    },
    board: {
      ...state.board,
      activeTab: "battlefieldTab",
      enabledTabs: {
        actionTab: false,
        battlefieldTab: true,
      },
      warZoneIsActive: !isD6,
    },
    teams: {
      ...state.teams,
      [state.currentTeam]: {
        ...state.teams[state.currentTeam],
        position: isD6
          ? state.teams[state.currentTeam].position
          : action.payload.spinner,
      },
    },
    countdown: {
      ...state.countdown,
      seconds: isD6 ? action.payload.timerAfter || 30 : 3,
    },
  };
};
