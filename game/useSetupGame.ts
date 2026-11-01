import { useEffect, useRef, useState } from "react";
import { SetupSettings, TeamName } from "@/game/game-types";

export type LobbyPlayer = {
  name: string;
  /** null: ainda no banco, sem time. */
  team: TeamName | null;
};

const STORAGE_KEY = "card-strike:lobby";
const SHUFFLE_STEP_MS = 180;
const SHUFFLE_STEPS = 8;

const EMPTY_LOBBY: LobbyPlayer[] = [
  { name: "", team: null },
  { name: "", team: null },
];

const otherTeam = (team: TeamName): TeamName => (team === "police" ? "faction" : "police");

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

const saveLobby = (players: LobbyPlayer[]) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
  } catch {
    // Segue sem salvar.
  }
};

export const useGameSetup = () => {
  const [players, setPlayers] = useState(EMPTY_LOBBY);
  const [isShuffling, setIsShuffling] = useState(false);
  const [restored, setRestored] = useState(false);
  const shuffleTimer = useRef<number | null>(null);

  // Só no navegador: o HTML do servidor não conhece o que foi salvo.
  useEffect(() => {
    const saved = readLobby();
    if (saved) setPlayers(saved);
    setRestored(true);
  }, []);

  useEffect(() => {
    if (restored && !isShuffling) saveLobby(players);
  }, [players, restored, isShuffling]);

  useEffect(
    () => () => {
      if (shuffleTimer.current) window.clearInterval(shuffleTimer.current);
    },
    [],
  );

  const setPlayerName = (index: number, name: string) =>
    setPlayers((current) => current.map((p, i) => (i === index ? { ...p, name } : p)));

  /** Coloca o jogador no time; quem já estava lá vai para o lugar dele. */
  const movePlayer = (index: number, team: TeamName | null) =>
    setPlayers((current) => {
      const previous = current[index].team;
      return current.map((p, i) => {
        if (i === index) return { ...p, team };
        return team && p.team === team ? { ...p, team: previous } : p;
      });
    });

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

  const police = players.find((p) => p.team === "police");
  const faction = players.find((p) => p.team === "faction");
  const namesFilled = players.every((p) => p.name.trim());
  const canStart = !!police && !!faction && namesFilled && !isShuffling;

  const buildSetup = (): SetupSettings | null =>
    canStart
      ? {
          police: { playerName: police.name.trim() },
          faction: { playerName: faction.name.trim() },
        }
      : null;

  return {
    players,
    isShuffling,
    namesFilled,
    canStart,
    setPlayerName,
    movePlayer,
    swapTeams,
    shuffleTeams,
    buildSetup,
  };
};
