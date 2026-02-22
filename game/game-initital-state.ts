import { GameState, SetupSettings } from "./game-types";

export const createInitialGameState = (setup: SetupSettings): GameState => ({
  currentTeam: "faction",
  turnPhase: "COUNTDOWN",
  turnAction: "SELECTING_ACTION",

  playedCards: [],

  countdown: {
    gameTime: 0,
    seconds: 60,
    round: 1,
  },
  bomb: {
    exploded: false,
    planted: false,
    position: null,
    timer: 5,
    maxTime: 5,
  },
  board: {
    activeTab: "battlefieldTab",
    enabledTabs: {
      battlefieldTab: true,
      actionTab: false,
    },
    warZoneIsActive: true,
  },
  tool: {
    selected: null,
    isRolling: false,
    result: { d6: null, spinner: null },
  },
  teams: {
    faction: {
      playerName: setup.faction.playerName,
      health: 20,
      position: null,
      inventory: { hand: [], warZone: [] },
    },
    police: {
      playerName: setup.police.playerName,
      health: 20,
      position: null,
      inventory: { hand: [], warZone: [] },
    },
  },

  hud: {
    inventory: {
      isOpen: false,
      isLocked: false,
    },
  },
});
