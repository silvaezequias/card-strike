import { GameAction } from "../game-actions";
import { GameState } from "../game-types";

export const ActionSwitchTab = (
  state: GameState,
  action: GameAction<"SWITCH_TAB">,
): GameState => {
  if (state.board.enabledTabs[action.payload]) {
    return {
      ...state,
      board: {
        ...state.board,
        activeTab: action.payload,
      },
    };
  }

  return state;
};
