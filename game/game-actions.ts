import { Card } from "@/lib/types";
import { GamePhase, SetupSettings } from "./game-types";

export type GameAction =
  // Setup
  | {
      type: "SETUP";
      payload: SetupSettings;
    }

  // Turn Flow
  | { type: "START_TURN" }
  | { type: "END_TURN" }
  | { type: "SET_PHASE"; payload: GamePhase }

  // Cards
  | { type: "PLAY_CARD"; payload: { card: Card } }
  | { type: "BUY_CARD" }
  | { type: "KEEP_IN_HAND" }
  | {
      type: "PLACE_CARD";
      payload: {
        cardIndex: number;
        positionIndex: number;
      };
    }

  // Tools (Dice / Spinner)
  | { type: "SELECT_ACTION" }
  | { type: "SET_TOOL"; payload: "d6" | "spinner" }
  | { type: "ROLL_TOOL_START" }
  | {
      type: "ROLL_TOOL";
      payload: {
        d6: number;
        spinner: string;
      };
    }
  | {
      type: "ROLL_TOOL_COMPLETE";
      payload: {
        d6: number;
        spinner: "A" | "B" | "C";
        timerAfter?: number;
      };
    }

  // UI
  | { type: "SWITCH_TAB"; payload: "battlefieldTab" | "actionTab" }
  | { type: "TOGGLE_INVENTORY" }

  // Timer
  | { type: "TIMER" };
