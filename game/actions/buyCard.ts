import { createCardByName, generateRandomCard } from "@/lib/game-helpers";
import { GameState } from "../game-types";

export const ActionBuyCard = (state: GameState, cardName?: string): GameState => {
  const team = state.currentTeam;
  const card = (cardName && createCardByName(team, cardName)) || generateRandomCard(team);

  return {
    ...state,
    turnPhase: "PLACING",
    teams: {
      ...state.teams,
      [team]: {
        ...state.teams[team],
        inventory: {
          ...state.teams[team].inventory,
          hand: [...state.teams[team].inventory.hand, card],
        },
      },
    },
  };
};
