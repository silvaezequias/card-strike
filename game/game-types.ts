import { Card, Rotation } from "@/lib/types";

export type GamePhase =
  | "COUNTDOWN"
  | "BUYING"
  | "CHOOSING"
  | "ACTING"
  | "PLACING"
  | "IDLE";

export type TurnActionState =
  | "NONE"
  | "SELECTING_ACTION"
  | "ROLLING_DICE"
  | "POSITIONING_ROULETTE";

export interface BombData {
  planted: boolean;
  position: Bombsite | null;
  timer: number;
  exploded: boolean;
  maxTime: number;
}

export interface GameState {
  currentTeam: TeamName;
  turnPhase: GamePhase;
  turnAction: TurnActionState;

  bomb: BombData;
  countdown: {
    round: number;
    gameTime: number;
    seconds: number;
  };

  board: {
    activeTab: TBoardTabs;
    enabledTabs: Record<TBoardTabs, boolean>;
    warZoneIsActive: boolean;
  };
  tool: {
    isRolling: boolean;
    selected: Tool | null;
    result: {
      d6: number | null;
      spinner: string | null;
    };
  };
  teams: {
    faction: Team;
    police: Team;
  };
  hud: {
    inventory: {
      isOpen: boolean;
      isLocked: boolean;
    };
  };
}

export type SetupSettings = {
  police: Pick<Team, "playerName">;
  faction: Pick<Team, "playerName">;
};

export type Tool = "d6" | "spinner";
export type Bombsite = "A" | "B" | "C";
export type TBoardTabs = "battlefieldTab" | "actionTab";
export type TeamName = "police" | "faction";

export type Team = {
  playerName: string;
  position: Bombsite | null;
  health: number;

  inventory: {
    hand: Card[];
    warZone: Card[];
  };
};

export interface GameEngine {
  bottomPanel: {
    isEnabled: boolean;
    isOpen: boolean;

    toggleOpening: () => void;
    toggleEnabled: () => void;

    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setIsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  };

  board: {
    tabs: {
      enabled: Record<TBoardTabs, boolean>;
      active: TBoardTabs;

      setEnabled: React.Dispatch<
        React.SetStateAction<Record<TBoardTabs, boolean>>
      >;
      setActive: React.Dispatch<React.SetStateAction<TBoardTabs>>;
    };

    warZone: {
      active: boolean;
      setActive: React.Dispatch<React.SetStateAction<boolean>>;
    };
  };

  currentTeam: TeamName;
  setCurrentTeam: React.Dispatch<React.SetStateAction<TeamName>>;

  teams: {
    police: Team;
    faction: Team;

    hasCollision: boolean;
  };

  setTeams: React.Dispatch<React.SetStateAction<GameEngine["teams"]>>;

  tool: {
    selected: Tool;
    rotation: Record<Tool, Rotation>;
    isRolling: boolean;

    result: {
      d6?: number | null;
      spinner?: string | null;
    };

    setSelected: React.Dispatch<React.SetStateAction<Tool>>;
    setD6ToolRotation: React.Dispatch<React.SetStateAction<Rotation>>;
    setSpinnerToolRotation: React.Dispatch<React.SetStateAction<Rotation>>;
    setResult: React.Dispatch<
      React.SetStateAction<{
        d6?: number | null;
        spinner?: string | null;
      }>
    >;
  };

  state: {
    warZoneIsActive: boolean;
    turnPhase: GamePhase;

    setWarZoneIsActive: React.Dispatch<React.SetStateAction<boolean>>;
    setTurnPhase: React.Dispatch<React.SetStateAction<GamePhase>>;
  };

  countdown: {
    gameTime: number;
    seconds: number;
    roundCount: number;

    setGameTime: React.Dispatch<React.SetStateAction<number>>;
    setSeconds: React.Dispatch<React.SetStateAction<number>>;
    setRoundCount: React.Dispatch<React.SetStateAction<number>>;
  };

  bomb: BombData;
  setBomb: React.Dispatch<React.SetStateAction<BombData>>;

  showPreparationTime: boolean;
  setShowPreparationTime: React.Dispatch<React.SetStateAction<boolean>>;

  handleTurnEnd: () => void;
  handleNextRound: () => void;
  handleBuyCard: () => void;
  handleCountdownComplete: () => void;

  rollTool: () => void;

  isFactionTurn: boolean;
}
