"use client";

import { Ban, Clock, Hash, LucideArrowBigRightDash } from "lucide-react";
import { formatTime } from "@/lib/game-helpers";
import { GameEngine } from "@/game/useGameEngine";
import { GamePhase } from "@/game/game-types";
import { JSX } from "react";
import { useGameTheme } from "@/game/useGameTheme";
import { HUDPanel } from "../ui/hud-panel";

const HandleNextRound = ({ game }: { game: GameEngine }) => {
  const theme = useGameTheme(game.state.currentTeam);

  return (
    <div className={`border-l-2 mb-2 ${theme.border} pl-4`}>
      <h3
        className={`text-xl font-black tracking-[0.2em] uppercase mb-1 ${theme.text}`}
      >
        Passe a vez
      </h3>
      <p className="py-2 text-zinc-300 text-xs tracking-wider">
        Agora é a vez do seu oponente, passe para o próximo round para
        continuar.
      </p>
    </div>
  );
};

const ChooseAction = ({ game }: { game: GameEngine }) => {
  const theme = useGameTheme(game.state.currentTeam);
  return (
    <div className={`border-l-2 mb-2 ${theme.border} pl-4`}>
      <h3
        className={`text-xl font-black  tracking-[0.2em] uppercase mb-1 ${theme.text}`}
      >
        Escolha uma ação
      </h3>
      <p className="py-2 text-zinc-300 text-xs tracking-wider">
        Você precisa escolher entre rolar dados para posicionar cartas no seu
        deck ou girar a roleta para se posicionar em um dos Bombsites.
      </p>
    </div>
  );
};

const Acting = ({ game }: { game: GameEngine }) => {
  const theme = useGameTheme(game.state.currentTeam);
  return (
    <div className={`border-l-2 mb-2 ${theme.border} pl-4`}>
      <h3
        className={`text-xl font-black  tracking-[0.2em]  uppercase mb-1 ${theme.text}`}
      >
        {game.state.tool.selected === "d6" ? "Role os dados" : "Gire a roleta"}
      </h3>
      <p className="py-2 text-zinc-300 text-xs tracking-wider">
        {game.state.tool.selected === "d6"
          ? "Role os dados para posicionar suas cartas no deck. O número do dado corresponde à fileira onde a carta será posicionada."
          : "Gire a roleta para se posicionar em um dos Bombsites. O resultado da roleta pode te colocar mais próximo ou mais distante do seu oponente."}
      </p>
    </div>
  );
};

const Placing = ({ game }: { game: GameEngine }) => {
  const theme = useGameTheme(game.state.currentTeam);
  return (
    <div className={`border-l-2 mb-2 ${theme.border} pl-4`}>
      <h3
        className={`text-xl font-black  tracking-[0.2em] uppercase mb-1 ${theme.text}`}
      >
        Posicione suas cartas
      </h3>
      <p className="py-2 text-zinc-300 text-xs tracking-wider">
        Agora é hora de posicionar as cartas que você comprou no seu deck.
        Lembre-se que o número do dado corresponde à fileira onde a carta será
        posicionada.
        <br />
        <br />
        Você pode manter-las na mão para usar em rodadas futuras, mas elas não
        estarão ativas no próximo round se fizer isso.
      </p>
    </div>
  );
};

const Countdown = ({ game }: { game: GameEngine }) => {
  const theme = useGameTheme(game.state.currentTeam);
  return (
    <div className={`border-l-2 mb-2 ${theme.border} pl-4`}>
      <h3
        className={`text-xl font-black  tracking-[0.2em] uppercase mb-1 ${theme.text}`}
      >
        Aguarde a contagem regressiva
      </h3>
      <p className="py-2 text-zinc-300 text-xs tracking-wider">
        A contagem regressiva está ativa! Aguarde até que o tempo acabe para
        passar para o próximo round. Fique atento ao tempo restante para não
        perder a vez!
      </p>
    </div>
  );
};

const Buying = ({ game }: { game: GameEngine }) => {
  const theme = useGameTheme(game.state.currentTeam);
  return (
    <div className={`border-l-2 mb-2 ${theme.border} pl-4`}>
      <h3
        className={`text-xl font-black  tracking-[0.2em] uppercase mb-1 ${theme.text}`}
      >
        Compre cartas
      </h3>
      <p className="py-2 text-zinc-300 text-xs tracking-wider">
        Agora é hora de comprar cartas para o seu deck. Você pode comprar apenas
        uma por rodada, use com sabedoria!
      </p>
    </div>
  );
};

export const MissionStatus = ({ game }: { game: GameEngine }) => {
  const visualResponses: Partial<Record<GamePhase, JSX.Element>> = {
    CHOOSING: <ChooseAction game={game} />,
    ACTING: <Acting game={game} />,
    PLACING: <Placing game={game} />,
    COUNTDOWN: <Countdown game={game} />,
    IDLE: <HandleNextRound game={game} />,
    BUYING: <Buying game={game} />,
  };

  const { gameTime, seconds, round } = game.state.countdown;

  return (
    <HUDPanel game={game} title="STATUS DA MISSÃO" icon={<Clock size={12} />}>
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 text-zinc-400 text-xs tracking-widest mb-1">
          <Hash size={10} /> RODADA
        </div>
        <div className="text-4xl font-black text-white bg-zinc-800/50 px-4 py-1 rounded border border-zinc-700 shadow-inner">
          {round}
        </div>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[10px] text-zinc-500 tracking-widest mb-1">
          TEMPO DA RODADA
        </span>
        <div
          className={`text-4xl font-mono ${seconds < 10 ? "text-red-500 animate-pulse" : "text-zinc-200"} drop-shadow-md`}
        >
          {formatTime(seconds)}
        </div>
      </div>

      <div className="text-xs font-mono text-zinc-500">
        TOTAL: {formatTime(gameTime)}
      </div>
      <div className="w-2/3 h-[1px] bg-zinc-800"></div>

      <div className="flex flex-col justify-center items-center   gap-5 w-full">
        {visualResponses[game.state.turnPhase] || (
          <HandleNextRound game={game} />
        )}
      </div>
    </HUDPanel>
  );
};
