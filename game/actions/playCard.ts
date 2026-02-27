import { GameAction } from "../game-actions";
import { GameState } from "../game-types";

export const ActionPlayCard = (
  state: GameState,
  action: GameAction<"PLAY_CARD">,
): GameState => {
  const randomRot = Math.floor(Math.random() * 40) - 20;
  const randomX = Math.floor(Math.random() * 20) - 10;
  const randomY = Math.floor(Math.random() * 20) - 10;

  const { teams, currentTeam } = state;
  const { warZone: warZoneInventory } = teams[currentTeam].inventory;

  const warZoneInventoryFilterd = warZoneInventory.filter(
    (card) => card.id !== action.payload.card.id,
  );

  return {
    ...state,
    turnPhase: "IDLE",
    turnAction: "NONE",
    hud: {
      inventory: {
        isOpen: false,
        isLocked: false,
      },
    },
    countdown: {
      ...state.countdown,
      seconds: 3,
    },
    board: {
      warZoneIsActive: true,
      activeTab: "battlefieldTab",
      enabledTabs: {
        actionTab: false,
        battlefieldTab: true,
      },
    },
    teams: {
      ...state.teams,
      [currentTeam]: {
        ...state.teams[currentTeam],
        inventory: {
          ...state.teams[currentTeam].inventory,
          warZone: warZoneInventoryFilterd,
        },
      },
    },
    playedCards: [
      ...state.playedCards,
      {
        ...action.payload.card,
        teamOwner: currentTeam,
        style: {
          transform: `translate(${randomX}px, ${randomY}px) rotate(${randomRot}deg)`,
          zIndex: state.playedCards.length,
        },
      },
    ],
  };
};
