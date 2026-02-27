import { GameState } from "./game-types";
import { GameAction } from "./game-actions";
import { ActionTimer } from "./actions/timer";
import { ActionSetTool } from "./actions/setTool";
import { ActionSelectAction } from "./actions/selectAction";
import { ActionRollTool } from "./actions/rollTool";
import { ActionRollToolStart } from "./actions/rollToolStart";
import { ActionRollToolComplete } from "./actions/rollToolComplete";
import { ActionSwitchTab } from "./actions/switchTab";
import { ActionToggleInventory } from "./actions/toggleInventory";
import { ActionKeepInHand } from "./actions/keepInHand";
import { ActionEndTurn } from "./actions/endTurn";
import { ActionPlayCard } from "./actions/playCard";
import { ActionBuyCard } from "./actions/buyCard";
import { ActionPlaceCard } from "./actions/placeCard";

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "TIMER":
      return ActionTimer(state);

    case "SET_TOOL":
      return ActionSetTool(state, action);

    case "SELECT_ACTION":
      return ActionSelectAction(state);

    case "ROLL_TOOL":
      return ActionRollTool(state, action);

    case "ROLL_TOOL_START":
      return ActionRollToolStart(state);

    case "ROLL_TOOL_COMPLETE":
      return ActionRollToolComplete(state, action);

    case "SWITCH_TAB":
      return ActionSwitchTab(state, action);

    case "TOGGLE_INVENTORY":
      return ActionToggleInventory(state);

    case "KEEP_IN_HAND":
      return ActionKeepInHand(state);

    case "END_TURN":
      return ActionEndTurn(state);

    case "PLAY_CARD":
      return ActionPlayCard(state, action);

    case "BUY_CARD":
      return ActionBuyCard(state);

    case "PLACE_CARD":
      return ActionPlaceCard(state, action);

    default:
      return state;
  }
}
