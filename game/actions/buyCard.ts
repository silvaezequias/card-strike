import { createCardByName, generateRandomCard } from "@/lib/game-helpers";
import { GameState, TeamName } from "../game-types";

const MAX_HAND_SIZE = 3;

export const ActionBuyCard = (state: GameState, cardName?: string): GameState => {
  const team = state.currentTeam;
  if (state.boughtThisTurn || state.teams[team].inventory.hand.length >= MAX_HAND_SIZE) return state;

  const card = (cardName && createCardByName(team, cardName)) || generateRandomCard(team);

  return {
    ...state,
    turnPhase: "PLACING",
    boughtThisTurn: true,
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

/** Carta da distribuição inicial: vai para a mão sem contar como compra. */
export const ActionDealCard = (state: GameState, team: TeamName): GameState => {
  const hand = state.teams[team].inventory.hand;
  if (hand.length >= MAX_HAND_SIZE) return state;

  return {
    ...state,
    teams: {
      ...state.teams,
      [team]: {
        ...state.teams[team],
        inventory: { ...state.teams[team].inventory, hand: [...hand, generateRandomCard(team)] },
      },
    },
  };
};
