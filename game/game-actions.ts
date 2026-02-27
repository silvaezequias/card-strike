import { Card } from "@/lib/types";
import { GamePhase, SetupSettings } from "./game-types";

export type ActionWithoutPayload =
  | "END_TURN"
  | "BUY_CARD"
  | "KEEP_IN_HAND"
  | "SELECT_ACTION"
  | "ROLL_TOOL_START"
  | "TOGGLE_INVENTORY"
  | "TIMER";

export type ActionMap = {
  SETUP: SetupSettings;
  SET_PHASE: GamePhase;

  PLAY_CARD: { card: Card };
  PLACE_CARD: {
    cardIndex: number;
    positionIndex: number;
  };

  SET_TOOL: "d6" | "spinner";

  ROLL_TOOL: {
    d6: number;
    spinner: string;
  };

  ROLL_TOOL_COMPLETE: {
    d6: number;
    spinner: "A" | "B" | "C";
    timerAfter?: number;
  };

  SWITCH_TAB: "battlefieldTab" | "actionTab";
};

export type GameAction<
  T extends keyof ActionMap | ActionWithoutPayload =
    | keyof ActionMap
    | ActionWithoutPayload,
> = T extends keyof ActionMap
  ? { type: T; payload: ActionMap[T] }
  : T extends keyof ActionWithoutPayload
    ? { type: T }
    : { type: T };

export type GameActionObject =
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
