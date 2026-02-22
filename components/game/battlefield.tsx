import { GameEngine } from "@/game/useGameEngine";
import { InventoryGrid } from "./card";
import { Card } from "@/lib/types";
import { useGameTheme } from "@/game/useGameTheme";

type BattlefieldProps = {
  game: GameEngine;
};

export const Battlefield = ({ game }: BattlefieldProps) => {
  const inventory = [
    ...game.state.teams[game.state.currentTeam].inventory.warZone,
    ...Array.from({
      length:
        6 - game.state.teams[game.state.currentTeam].inventory.warZone.length,
    }).fill(null),
  ].slice(0, 6);

  return (
    <div className="w-full">
      {game.state.turnPhase === "PLACING" && <PositioningCard game={game} />}
      <InventoryGrid game={game} length={6} type="warZone" />
    </div>
  );
};

const PositioningCard = ({ game }: { game: GameEngine }) => {
  const theme = useGameTheme(game.state.currentTeam);

  return (
    <div>
      <h2
        className={`text-3xl text-center font-black tracking-widest mb-2 ${theme.text}`}
      >
        POSICIONE UMA CARTA
      </h2>
      <p className="text-zinc-400 text-center text-sm mb-8 font-bold tracking-wider">
        ESCOLHA UMA CARTA PARA O SLOT{" "}
        <span className={`animate-pulse duration-500 text-2xl ${theme.text}`}>
          {game.state.tool.result.d6}
        </span>
      </p>
    </div>
  );
};
