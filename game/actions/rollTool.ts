import { GameAction } from "../game-actions";
import { GameState } from "../game-types";

export const ActionRollTool = (
  state: GameState,
  action: GameAction<"ROLL_TOOL">,
): GameState => ({
  ...state,
  tool: {
    ...state.tool,
    result: action.payload,
  },
  turnPhase: "IDLE",
  countdown: {
    ...state.countdown,
    seconds: 3,
  },
});
