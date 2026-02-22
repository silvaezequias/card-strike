import { useState } from "react";
import { SetupSettings } from "@/game/game-types";

type Team = "police" | "faction";

type SetupState = {
  players: {
    name: string;
    team: Team | null;
  }[];
  isShuffling: boolean;
};

export const useGameSetup = () => {
  const [state, setState] = useState<SetupState>({
    players: [
      { name: "", team: null },
      { name: "", team: null },
    ],
    isShuffling: false,
  });

  const namesFilled =
    state.players[0].name.trim() && state.players[1].name.trim();

  const canStart = namesFilled && state.players[0].team !== null;

  const shuffleTeams = () => {
    if (!namesFilled) return;

    setState((prev) => ({ ...prev, isShuffling: true }));

    let current: Team = "police";

    // alterna rapidamente
    const interval = setInterval(() => {
      current = current === "police" ? "faction" : "police";

      setState((prev) => ({
        ...prev,
        players: [
          { ...prev.players[0], team: current },
          {
            ...prev.players[1],
            team: current === "police" ? "faction" : "police",
          },
        ],
      }));
    }, 200); // velocidade da animação

    // finaliza após 1200ms
    setTimeout(() => {
      clearInterval(interval);

      const finalTeam: Team = Math.random() > 0.5 ? "police" : "faction";

      setState((prev) => ({
        ...prev,
        players: [
          { ...prev.players[0], team: finalTeam },
          {
            ...prev.players[1],
            team: finalTeam === "police" ? "faction" : "police",
          },
        ],
        isShuffling: false,
      }));
    }, 2000);
  };

  const buildSetup = (): SetupSettings | null => {
    if (!canStart) return null;

    const police = state.players.find((p) => p.team === "police")!;
    const faction = state.players.find((p) => p.team === "faction")!;

    return {
      police: { playerName: police.name.trim() },
      faction: { playerName: faction.name.trim() },
    };
  };

  const setPlayerName = (index: 0 | 1, name: string) => {
    setState((prev) => {
      const players = [...prev.players];
      players[index] = { ...players[index], name };
      return { ...prev, players };
    });
  };

  return {
    state,
    canStart,
    shuffleTeams,
    buildSetup,
    setPlayerName,
  };
};
