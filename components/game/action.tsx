import { GameEngine } from "@/game/useGameEngine";
import { useGameTheme } from "@/game/useGameTheme";
import { ArrowLeft, Dices } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { HIGHLIGHT_CLASS, useGate } from "./tutorial-gate";

/** Barra do dado: segurar balança na mão, soltar lança sobre o tabuleiro. */
export const DiceDock = ({ game }: { game: GameEngine }) => {
  const theme = useGameTheme(game.state.currentTeam);
  const rollGate = useGate("roll");
  const backGate = useGate("back");
  const [holding, setHolding] = useState(false);
  const { isRolling } = game.state.tool;
  const gameRef = useRef(game);
  gameRef.current = game;

  const startShake = () => {
    if (isRolling || !rollGate.allowed) return;
    setHolding(true);
    game.tool.shakeDice(true);
  };

  // Solta em qualquer lugar da tela, não só em cima do botão.
  useEffect(() => {
    if (!holding) return;
    const release = () => {
      setHolding(false);
      gameRef.current.tool.roll();
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, [holding]);

  return (
    <div className="pointer-events-auto absolute bottom-14 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2">
      <p className={`text-xs font-bold uppercase tracking-[0.25em] drop-shadow ${theme.text}`}>
        {isRolling ? "Rolando..." : holding ? "Solte para lançar" : "Segure para balançar o dado"}
      </p>
      <div className="flex items-center gap-2">
        <button
          disabled={isRolling || !backGate.allowed}
          onClick={() => game.dispatch({ type: "SELECT_ACTION" })}
          className="flex items-center gap-2 rounded-lg border border-white/15 bg-black/60 px-3 py-3 text-xs font-bold uppercase tracking-widest text-zinc-300 backdrop-blur-sm transition-colors hover:text-white disabled:hidden"
        >
          <ArrowLeft size={14} />
          Voltar
        </button>
        <button
          disabled={isRolling || !rollGate.allowed}
          onPointerDown={startShake}
          // Teclado: Enter ou espaço lançam direto.
          onClick={(e) => e.detail === 0 && game.tool.roll()}
          className={`${rollGate.highlighted ? HIGHLIGHT_CLASS : ""} ${
            holding ? "scale-95" : ""
          } flex touch-none items-center gap-2 rounded-lg border-2 ${theme.border} bg-black/70 px-6 py-3 text-sm font-black uppercase tracking-widest text-white backdrop-blur-sm transition-transform disabled:opacity-50`}
        >
          <Dices size={18} />
          Rolar dado
        </button>
      </div>
    </div>
  );
};
