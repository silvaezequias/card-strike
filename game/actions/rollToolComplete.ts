import { GameAction } from "../game-actions";
import { GameState } from "../game-types";

export const ActionRollToolComplete = (
  state: GameState,
  action: GameAction<"ROLL_TOOL_COMPLETE">,
): GameState => {
  const isD6 = state.tool.selected === "d6";

  return {
    ...state,
    // Depois do dado o jogador decide: jogar a carta do slot sorteado,
    // comprar (se tiver espaço na mão) ou posicionar uma carta da mão.
    turnPhase: isD6 ? "PLACING" : "IDLE",
    turnAction: "NONE",

    hud: {
      inventory: {
        isOpen: isD6,
        isLocked: isD6,
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
      warZoneIsActive: !isD6,
    },
    teams: {
      ...state.teams,
      [state.currentTeam]: {
        ...state.teams[state.currentTeam],
        position: isD6
          ? state.teams[state.currentTeam].position
          : action.payload.spinner,
      },
    },
    countdown: {
      ...state.countdown,
      seconds: isD6 ? action.payload.timerAfter || 30 : 3,
    },
  };
};
