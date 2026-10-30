import { GameAction } from "../game-actions";
import { GameState } from "../game-types";
import { resolveCard } from "../card-effects";

export const ActionPlayCard = (
  state: GameState,
  action: GameAction<"PLAY_CARD">,
): GameState => {
  const randomRot = Math.floor(Math.random() * 40) - 20;
  const randomX = Math.floor(Math.random() * 20) - 10;
  const randomY = Math.floor(Math.random() * 20) - 10;

  const { currentTeam } = state;
  const { teams, bomb, result } = resolveCard(state, action.payload.card);

  // Só esvazia o slot da carta: as outras continuam onde estão.
  const warZoneWithoutCard = teams[currentTeam].inventory.warZone.map((card) =>
    card?.id === action.payload.card.id ? null : card,
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
    bomb,
    lastResult: result,
    teams: {
      ...teams,
      [currentTeam]: {
        ...teams[currentTeam],
        inventory: {
          ...teams[currentTeam].inventory,
          warZone: warZoneWithoutCard,
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
