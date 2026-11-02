import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_RULES,
  GameRules,
  SetupSettings,
  TeamName,
} from "@/game/game-types";

export type LobbyPlayer = {
  name: string;
  /** null: ainda no banco, sem time. */
  team: TeamName | null;
};

/** Modos que já podem ser jogados. */
export type GameMode = "solo" | "local";

export const BOT_NAME = "BOT";

const STORAGE_KEY = "card-strike:lobby";
const MODE_STORAGE_KEY = "card-strike:mode";
const RULES_STORAGE_KEY = "card-strike:rules";
const SHUFFLE_STEP_MS = 180;
const SHUFFLE_STEPS = 8;

const EMPTY_LOBBY: LobbyPlayer[] = [
  { name: "", team: null },
  { name: "", team: null },
];

const otherTeam = (team: TeamName): TeamName =>
  team === "police" ? "faction" : "police";

const withTeams = (players: LobbyPlayer[], first: TeamName) => [
  { ...players[0], team: first },
  { ...players[1], team: otherTeam(first) },
];

const isSavedLobby = (data: unknown): data is LobbyPlayer[] =>
  Array.isArray(data) &&
  data.length === EMPTY_LOBBY.length &&
  data.every((p) => typeof p?.name === "string");

/** Armazenamento pode estar bloqueado: aí o lobby só não fica salvo. */
const readLobby = () => {
  try {
    const data = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "null");
    return isSavedLobby(data) ? data : null;
  } catch {
    return null;
  }
};

const readMode = (): GameMode | null => {
  try {
    const mode = window.localStorage.getItem(MODE_STORAGE_KEY);
    return mode === "solo" || mode === "local" ? mode : null;
  } catch {
    return null;
  }
};

const readRules = (): GameRules => {
  try {
    const data = JSON.parse(
      window.localStorage.getItem(RULES_STORAGE_KEY) ?? "null",
    );
    return { ...DEFAULT_RULES, hiddenCards: data?.hiddenCards === true };
  } catch {
    return DEFAULT_RULES;
  }
};

const saveLobby = (
  players: LobbyPlayer[],
  mode: GameMode,
  rules: GameRules,
) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
    window.localStorage.setItem(MODE_STORAGE_KEY, mode);
    window.localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(rules));
  } catch {
    // Segue sem salvar.
  }
};

export const useGameSetup = () => {
  const [players, setPlayers] = useState(EMPTY_LOBBY);
  const [mode, setMode] = useState<GameMode>("local");
  const [rules, setRules] = useState<GameRules>(DEFAULT_RULES);
  const [isShuffling, setIsShuffling] = useState(false);
  const [restored, setRestored] = useState(false);
  const shuffleTimer = useRef<number | null>(null);

  // Só no navegador: o HTML do servidor não conhece o que foi salvo.
  useEffect(() => {
    const saved = readLobby();
    if (saved) setPlayers(saved);
    const savedMode = readMode();
    if (savedMode) setMode(savedMode);
    setRules(readRules());
    setRestored(true);
  }, []);

  useEffect(() => {
    if (restored && !isShuffling) saveLobby(players, mode, rules);
  }, [players, mode, rules, restored, isShuffling]);

  useEffect(
    () => () => {
      if (shuffleTimer.current) window.clearInterval(shuffleTimer.current);
    },
    [],
  );

  const setPlayerName = (index: number, name: string) =>
    setPlayers((current) =>
      current.map((p, i) => (i === index ? { ...p, name } : p)),
    );

  /** Coloca o jogador no time; quem já estava lá vai para o lugar dele. */
  const movePlayer = (index: number, team: TeamName | null) =>
    setPlayers((current) => {
      const previous = current[index].team;
      return current.map((p, i) => {
        if (i === index) return { ...p, team };
        return team && p.team === team ? { ...p, team: previous } : p;
      });
    });

  /** Todos sem time: a escolha acontece na tela de times. */
  const clearTeams = () =>
    setPlayers((current) => current.map((p) => ({ ...p, team: null })));

  const setRule = <K extends keyof GameRules>(key: K, value: GameRules[K]) =>
    setRules((current) => ({ ...current, [key]: value }));

  const swapTeams = () =>
    setPlayers((current) =>
      current.map((p) => ({ ...p, team: p.team && otherTeam(p.team) })),
    );

  const shuffleTeams = () => {
    if (isShuffling) return;
    setIsShuffling(true);

    let step = 0;
    let first: TeamName = "police";
    shuffleTimer.current = window.setInterval(() => {
      step++;
      first = otherTeam(first);
      if (step < SHUFFLE_STEPS) {
        setPlayers((current) => withTeams(current, first));
        return;
      }

      window.clearInterval(shuffleTimer.current!);
      const result: TeamName = Math.random() < 0.5 ? "police" : "faction";
      setPlayers((current) => withTeams(current, result));
      setIsShuffling(false);
    }, SHUFFLE_STEP_MS);
  };

  // Sozinho, só o jogador 1 aparece; o bot fica com o time que sobrar.
  const seats = players
    .map((player, index) => ({ player, index }))
    .filter(({ index }) => mode === "local" || index === 0);
  const humanTeam = players[0].team;
  const botTeam = mode === "solo" && humanTeam ? otherTeam(humanTeam) : null;

  const nameOn = (team: TeamName) =>
    team === botTeam
      ? BOT_NAME
      : seats.find(({ player }) => player.team === team)?.player.name.trim();

  const namesFilled = seats.every(({ player }) => player.name.trim());
  const teamsFilled = !!nameOn("police") && !!nameOn("faction");
  const allSeated = seats.every(({ player }) => player.team);
  const canStart =
    allSeated &&
    (mode === "solo" ? !!botTeam : teamsFilled) &&
    namesFilled &&
    !isShuffling;

  const buildSetup = (): SetupSettings | null =>
    canStart
      ? {
          police: { playerName: nameOn("police")! },
          faction: { playerName: nameOn("faction")! },
          botTeam,
          rules,
        }
      : null;

  return {
    mode,
    setMode,
    seats,
    botTeam,
    isShuffling,
    namesFilled,
    canStart,
    setPlayerName,
    movePlayer,
    clearTeams,
    rules,
    setRule,
    swapTeams,
    shuffleTeams,
    buildSetup,
  };
};
