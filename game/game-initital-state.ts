import { generateRandomCard } from "@/lib/game-helpers";
import { GameState, SetupSettings, TeamName } from "./game-types";

const STARTING_CARDS = 3;

const dealHand = (team: TeamName, size: number) =>
  Array.from({ length: size }, () => generateRandomCard(team));

export const createInitialGameState = (
  setup: SetupSettings,
  startingCards = STARTING_CARDS,
): GameState => ({
  botTeam: setup.botTeam ?? null,
  currentTeam: "faction",
  turnPhase: "COUNTDOWN",
  turnAction: "SELECTING_ACTION",
  boughtThisTurn: false,

  playedCards: [],
  lastResult: null,
  combatEvent: null,
  mapEffects: [],

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
      inventory: { hand: dealHand("faction", startingCards), warZone: Array(6).fill(null) },
      effects: [],
    },
    police: {
      playerName: setup.police.playerName,
      health: 20,
      position: null,
      inventory: { hand: dealHand("police", startingCards), warZone: Array(6).fill(null) },
      effects: [],
    },
  },

  hud: {
    inventory: {
      isOpen: false,
      isLocked: false,
    },
  },
});
