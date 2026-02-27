import { generateRandomCard } from "@/lib/game-helpers";
import { GameState } from "../game-types";

export const ActionBuyCard = (state: GameState): GameState => {
  const team = state.currentTeam;

  return {
    ...state,
    turnPhase: "PLACING",
    teams: {
      ...state.teams,
      [team]: {
        ...state.teams[team],
        inventory: {
          ...state.teams[team].inventory,
          hand: [...state.teams[team].inventory.hand, generateRandomCard(team)],
        },
      },
    },
  };
};
