import { generateRandomCard } from "@/lib/game-helpers";
import { GameState } from "./game-types";
import { GameAction } from "./game-actions";

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "TIMER":
      return {
        ...state,
        countdown: {
          ...state.countdown,
          gameTime: state.countdown.gameTime + 1,
          seconds:
            state.countdown.seconds > 0 ? state.countdown.seconds - 1 : 0,
        },
      };

    case "END_TURN":
      return {
        ...state,
        currentTeam: state.currentTeam === "faction" ? "police" : "faction",
        turnPhase: "COUNTDOWN",
        tool: {
          ...state.tool,
          selected: null,
        },
        countdown: {
          ...state.countdown,
          round: state.countdown.round + 1,
          seconds: 60,
        },
        hud: {
          inventory: {
            isOpen: false,
            isLocked: false,
          },
        },
      };

    case "BUY_CARD":
      const team = state.currentTeam;

      return {
        ...state,
        teams: {
          ...state.teams,
          [team]: {
            ...state.teams[team],
            inventory: {
              ...state.teams[team].inventory,
              hand: [
                ...state.teams[team].inventory.hand,
                generateRandomCard(team),
              ],
            },
          },
        },
      };

    case "SET_TOOL":
      return {
        ...state,
        turnPhase: "ACTING",
        turnAction:
          action.payload === "d6" ? "ROLLING_DICE" : "POSITIONING_ROULETTE",

        hud: {
          inventory: {
            isOpen: false,
            isLocked: true,
          },
        },
        board: {
          ...state.board,
          activeTab: "actionTab",
          enabledTabs: {
            actionTab: true,
            battlefieldTab: false,
          },
        },
        tool: {
          ...state.tool,
          selected: action.payload,
        },
      };

    case "START_TURN":
    case "SELECT_ACTION":
      return {
        ...state,
        turnPhase: "CHOOSING",
        turnAction: "SELECTING_ACTION",
        tool: {
          ...state.tool,
          selected: null,
        },
        hud: {
          inventory: {
            ...state.hud.inventory,
            isLocked: false,
          },
        },
        board: {
          ...state.board,
          activeTab: "actionTab",
          enabledTabs: {
            actionTab: true,
            battlefieldTab: true,
          },
          warZoneIsActive: true,
        },
      };

    case "ROLL_TOOL":
      return {
        ...state,
        tool: {
          ...state.tool,
          result: action.payload,
        },
        turnPhase: "IDLE",

        countdown: {
          ...state.countdown,
          seconds: 10,
        },
      };
    case "ROLL_TOOL_START":
      return {
        ...state,
        hud: {
          inventory: {
            isOpen: false,
            isLocked: true,
          },
        },
        board: {
          ...state.board,
          activeTab: "actionTab",
          enabledTabs: {
            actionTab: true,
            battlefieldTab: false,
          },
        },
        tool: {
          ...state.tool,
          isRolling: true,
        },
      };

    case "ROLL_TOOL_COMPLETE":
      return {
        ...state,
        turnPhase: state.tool.selected === "spinner" ? "IDLE" : "PLACING",
        turnAction: "NONE",
        hud: {
          inventory: {
            isOpen: state.tool.selected === "d6",
            isLocked: state.tool.selected === "d6",
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
          warZoneIsActive: state.tool.selected === "spinner",
        },
        teams: {
          ...state.teams,
          [state.currentTeam]: {
            ...state.teams[state.currentTeam],
            position: action.payload.spinner,
          },
        },
      } as GameState;

    case "SWITCH_TAB":
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
    case "TOGGLE_INVENTORY":
      return {
        ...state,
        hud: {
          inventory: {
            ...state.hud.inventory,
            isOpen: state.hud.inventory.isLocked
              ? state.hud.inventory.isOpen
              : !state.hud.inventory.isOpen,
          },
        },
      };

    case "KEEP_IN_HAND":
      return {
        ...state,
        turnPhase: "IDLE",
        turnAction: "NONE",
        countdown: {
          ...state.countdown,
          seconds: 10,
        },
        hud: {
          inventory: {
            ...state.hud.inventory,
            isOpen: false,
            isLocked: false,
          },
        },
        board: {
          ...state.board,
          activeTab: "battlefieldTab",
          enabledTabs: {
            actionTab: false,
            battlefieldTab: true,
          },
          warZoneIsActive: true,
        },
      };

    case "PLACE_CARD":
      const { cardIndex, positionIndex } = action.payload;
      const currentTeam = state.currentTeam;
      const cardToPlace = state.teams[currentTeam].inventory.hand[cardIndex];

      const warZoneInventory = state.teams[currentTeam].inventory.warZone;
      const handInventory = state.teams[currentTeam].inventory.hand.filter(
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
              hand: handInventory,
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
          seconds: 10,
        },
        hud: {
          inventory: {
            isOpen: false,
            isLocked: false,
          },
        },
      };

    default:
      return state;
  }
}
