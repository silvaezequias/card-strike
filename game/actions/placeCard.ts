import { GameAction } from "../game-actions";
import { GameState } from "../game-types";

export const ActionPlaceCard = (
  state: GameState,
  action: GameAction<"PLACE_CARD">,
): GameState => {
  const { currentTeam } = state;
  const { hand: handInventory, warZone: warZoneInventory } =
    state.teams[currentTeam].inventory;

  const { cardIndex, positionIndex } = action.payload;
  const cardToPlace = handInventory[cardIndex];
  const handInventoryFiltered = handInventory.filter(
    (_, index) => index !== cardIndex,
  );
  warZoneInventory[positionIndex] = cardToPlace;

  if (!cardToPlace) return state;

  return {
    ...state,
    turnAction: "NONE",
    turnPhase: "IDLE",
    teams: {
      ...state.teams,
      [currentTeam]: {
        ...state.teams[currentTeam],
        inventory: {
          hand: handInventoryFiltered,
          warZone: warZoneInventory,
        },
      },
    },
    board: {
      activeTab: "battlefieldTab",
      enabledTabs: {
        actionTab: false,
        battlefieldTab: true,
      },
      warZoneIsActive: true,
    },
    tool: {
      ...state.tool,
      selected: null,
    },
    countdown: {
      ...state.countdown,
      seconds: 3,
    },
    hud: {
      inventory: {
        isOpen: false,
        isLocked: false,
      },
    },
  };
};
