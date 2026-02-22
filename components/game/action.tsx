import { Tool } from "@/game/game-types";
import { GameEngine } from "@/game/useGameEngine";
import { useGameTheme } from "@/game/useGameTheme";
import { ArrowLeft, Dices, MapPin, Sun } from "lucide-react";

type ActionProps = {
  game: GameEngine;
};

type ChoiceButtonProps = {
  game: GameEngine;
  onChoose: (mode: Tool) => void;
};

type RollDiceProps = {
  game: GameEngine;
};

type SpinnerProps = {
  game: GameEngine;
};

export const Action = ({ game }: ActionProps) => {
  const theme = useGameTheme(game.state.currentTeam);

  if (!game.state.tool.selected)
    return (
      <ChoiceButton
        game={game}
        onChoose={(mode) => game.dispatch({ type: "SET_TOOL", payload: mode })}
      />
    );

  return (
    <div className="flex items-center justify-center animate-in h-full w-full gap-4 flex-col fade-in duration-300">
      <div className={`rounded-2xl p-6 max-w-sm w-full text-center`}>
        {/* Title */}
        <h3
          className={`text-xl font-black tracking-[0.2em] uppercase mb-1 ${theme.text}`}
        >
          {game.state.tool.selected === "d6"
            ? "Escolher Slot"
            : "Definir Posicao"}
        </h3>
        <p className="text-zinc-500 text-[10px] font-bold tracking-wider mb-6">
          {game.state.tool.selected === "d6"
            ? "Role o dado para sortear um slot do tabuleiro"
            : "Gire a roleta para se mover a um Bombsite"}
        </p>

        <div
          className={`w-full flex items-center justify-center perspective-800 h-40 rounded`}
        >
          {game.state.tool.selected === "d6" ? (
            <RollDice game={game} />
          ) : (
            <Spinner game={game} />
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          disabled={game.state.tool.isRolling}
          onClick={() => game.dispatch({ type: "SELECT_ACTION" })}
          className={`p-3 disabled:hidden rounded-lg text-sm font-bold text-white tracking-wider disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg`}
        >
          <ArrowLeft size={16} className="mr-2" />
          Voltar para ações
        </button>

        {/* Roll button */}
        <button
          onClick={game.tool.roll}
          disabled={game.state.tool.isRolling}
          className={`p-3 ${theme.overlayScrim} rounded-lg text-sm font-bold text-white tracking-wider transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg`}
        >
          {game.state.tool.isRolling ? (
            "ROLANDO..."
          ) : game.state.tool.selected === "d6" ? (
            <>
              <Dices size={16} className="mr-2" /> ROLAR DADO
            </>
          ) : (
            <>
              <Sun size={16} className="mr-2" /> GIRAR ROLETA
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const Spinner = ({ game }: SpinnerProps) => {
  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <div className="absolute top-0 z-20 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-l-transparent border-r-transparent border-t-red-500 drop-shadow-md" />
      <div
        className={`w-full h-full rounded-full border-2  bg-zinc-800 relative overflow-hidden shadow-xl transition-transform cubic-bezier(0.1, 0.8, 0.1, 1)`}
        style={{
          transform: `rotate(${game.tool.rotation.spinner.z}deg)`,
          background:
            "conic-gradient(from 300deg, #44403c 0deg 120deg, #292524 120deg 240deg, #1c1917 240deg 360deg)",
          transitionDuration: "3000ms",
        }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-1/2 top-0 w-[2px] h-[50%] bg-white origin-bottom rotate-[-60deg] translate-x-[50%] " />
          <div className="absolute left-1/2 top-0 w-[2px] h-[50%] bg-white origin-bottom rotate-[60deg] translate-x-[-50%]" />
          <div className="absolute left-1/2 top-0 w-[2px] h-[50%] bg-white origin-bottom rotate-180 translate-x-[-50%] " />
        </div>
        <div className="absolute inset-0 flex justify-center pt-3">
          <span className={`font-bold text-white text-2xl drop-shadow-md`}>
            A
          </span>
        </div>
        <div
          className={`absolute inset-0 flex justify-center pt-3 rotate-[120deg]`}
        >
          <span className={`font-bold text-white text-2xl drop-shadow-md`}>
            B
          </span>
        </div>
        <div
          className={`absolute inset-0 flex justify-center pt-3 rotate-[240deg]`}
        >
          <span className={`font-bold text-white text-2xl drop-shadow-md`}>
            C
          </span>
        </div>
      </div>
    </div>
  );
};

const RollDice = ({ game }: RollDiceProps) => {
  const theme = useGameTheme(game.state.currentTeam);

  return (
    <div
      className="w-28 h-28 transform-style-3d transition-transform ease-out"
      style={{
        transform: `rotateX(${game.tool.rotation.d6.x}deg) rotateY(${game.tool.rotation.d6.y}deg) rotateZ(${game.tool.rotation.d6.z}deg)`,
        transitionDuration: "3000ms",
      }}
    >
      {/* D6 faces */}
      <div
        className={`absolute inset-0 bg-zinc-800 border-2 ${theme.border} rounded-lg flex items-center justify-center text-5xl font-bold ${theme.text} shadow-inner backface-hidden`}
        style={{ transform: `rotateY(0deg) translateZ(56px)` }}
      >
        1
      </div>
      <div
        className={`absolute inset-0 bg-zinc-800 border-2 ${theme.border} rounded-lg flex items-center justify-center text-5xl font-bold ${theme.text} shadow-inner backface-hidden`}
        style={{
          transform: `rotateY(180deg) rotateZ(180deg) translateZ(56px)`,
        }}
      >
        6
      </div>
      <div
        className={`absolute inset-0 bg-zinc-800 border-2 ${theme.border} rounded-lg flex items-center justify-center text-5xl font-bold ${theme.text} shadow-inner backface-hidden`}
        style={{ transform: `rotateY(90deg) translateZ(56px)` }}
      >
        3
      </div>
      <div
        className={`absolute inset-0 bg-zinc-800 border-2 ${theme.border} rounded-lg flex items-center justify-center text-5xl font-bold ${theme.text} shadow-inner backface-hidden`}
        style={{ transform: `rotateY(-90deg) translateZ(56px)` }}
      >
        4
      </div>
      <div
        className={`absolute inset-0 bg-zinc-800 border-2 ${theme.border} rounded-lg flex items-center justify-center text-5xl font-bold ${theme.text} shadow-inner backface-hidden`}
        style={{ transform: `rotateX(90deg) translateZ(56px)` }}
      >
        2
      </div>
      <div
        className={`absolute inset-0 bg-zinc-800 border-2 ${theme.border} rounded-lg flex items-center justify-center text-5xl font-bold ${theme.text} shadow-inner backface-hidden`}
        style={{ transform: `rotateX(-90deg) translateZ(56px)` }}
      >
        5
      </div>
    </div>
  );
};

const ChoiceButton = ({ onChoose, game }: ChoiceButtonProps) => {
  const theme = useGameTheme(game.state.currentTeam);

  return (
    <div className="flex items-center justify-center animate-in fade-in duration-300">
      <div className={`rounded-2xl py-9 max-w-lg w-full text-center`}>
        <h2
          className={`text-3xl font-black tracking-widest uppercase mb-2 ${theme.text}`}
        >
          {"TURNO DA"} {game.currentTeamName}
        </h2>
        <p className="text-zinc-400 text-sm mb-8 font-bold tracking-wider">
          {"ESCOLHA SUA AÇÃO TÁTICA"}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onChoose("d6")}
            className={`group p-3 rounded-xl aspect-square max-w-52 justify-center transition-all duration-300 hover:scale-105 active:scale-95 flex flex-col items-center gap-4 ${theme.overlayScrim}`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center bg-black/50 border-2 ${theme.text} ${theme.border}`}
            >
              <Dices size={26} />
            </div>
            <div>
              <div className="text-white font-bold text-base tracking-wider">
                POSICIONAR CARTA
              </div>
              <div className="text-[12px] text-zinc-400 mt-1 leading-tight">
                {
                  "Jogue o dado para posicionar ou substituir uma carta nos slots."
                }
              </div>
            </div>
          </button>

          <button
            onClick={() => onChoose("spinner")}
            className={`group relative p-3 aspect-square max-w-52 justify-center rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 flex flex-col items-center gap-4 ${theme.overlayScrimSecondary}`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center bg-black/50 border-2 ${theme.textSecondary} ${theme.borderSecondary}`}
            >
              <MapPin size={26} />
            </div>
            <div>
              <div className="text-white font-bold text-base tracking-wider">
                SE POSICIONAR
              </div>
              <div className="text-[12px] text-zinc-400 mt-1 leading-tight">
                {
                  "Gire a roleta para mover seu time para um Bombsite (A, B, C)."
                }
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
