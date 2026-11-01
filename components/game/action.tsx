import { Tool } from "@/game/game-types";
import { GameEngine } from "@/game/useGameEngine";
import { useGameTheme } from "@/game/useGameTheme";
import { ArrowLeft, Dices, Sun } from "lucide-react";
import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";
import { ArtPalette, factionPalette, getPalette, policePalette } from "@/components/art/palette";
import { HIGHLIGHT_CLASS, useGate } from "./tutorial-gate";

type ActionProps = {
  game: GameEngine;
};

type ChoiceButtonProps = {
  game: GameEngine;
  onChoose: (mode: Tool) => void;
};

type SpinnerProps = {
  game: GameEngine;
};

export const Action = ({ game }: ActionProps) => {
  const theme = useGameTheme(game.state.currentTeam);
  const rollGate = useGate("roll");
  const backGate = useGate("back");

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
          Definir Posição
        </h3>
        <p className="text-zinc-500 text-[10px] font-bold tracking-wider mb-6">
          Gire a roleta para se mover a um Bombsite
        </p>

        <div className="w-full flex items-center justify-center h-44 rounded">
          <Spinner game={game} />
        </div>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          disabled={game.state.tool.isRolling || !backGate.allowed}
          onClick={() => game.dispatch({ type: "SELECT_ACTION" })}
          className={`p-3 disabled:hidden rounded-lg text-sm font-bold text-white tracking-wider disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg`}
        >
          <ArrowLeft size={16} className="mr-2" />
          Voltar para ações
        </button>

        {/* Roll button */}
        <button
          onClick={() => game.tool.roll()}
          disabled={game.state.tool.isRolling || !rollGate.allowed}
          className={`${rollGate.highlighted ? HIGHLIGHT_CLASS : ""} p-3 ${theme.overlayScrim} rounded-lg text-sm font-bold text-white tracking-wider transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg`}
        >
          {game.state.tool.isRolling ? (
            "GIRANDO..."
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

/** Ponto no disco da roleta; o ângulo conta a partir do topo, em sentido horário. */
const dialPoint = (radius: number, degrees: number) => {
  const angle = (degrees * Math.PI) / 180;
  return {
    x: (100 + radius * Math.sin(angle)).toFixed(2),
    y: (100 - radius * Math.cos(angle)).toFixed(2),
  };
};

const DIAL_RADIUS = 86;
const DIAL_SITES = [
  { site: "A", angle: 0 },
  { site: "B", angle: 120 },
  { site: "C", angle: 240 },
];

const sectorPath = (angle: number) => {
  const from = dialPoint(DIAL_RADIUS, angle - 60);
  const to = dialPoint(DIAL_RADIUS, angle + 60);
  return `M100,100 L${from.x},${from.y} A${DIAL_RADIUS},${DIAL_RADIUS} 0 0 1 ${to.x},${to.y} Z`;
};

/** Roleta dos bombsites, no visual do mapa tático. */
const Spinner = ({ game }: SpinnerProps) => {
  const p = getPalette(game.state.currentTeam);

  return (
    <div className="relative h-44 w-44">
      <svg
        viewBox="0 0 200 200"
        className="absolute inset-0 h-full w-full transition-transform"
        style={{
          transform: `rotate(${game.tool.rotation.spinner.z}deg)`,
          transitionDuration: "3000ms",
          transitionTimingFunction: "cubic-bezier(0.1, 0.8, 0.1, 1)",
        }}
        aria-hidden="true"
      >
        {DIAL_SITES.map(({ site, angle }, i) => (
          <path key={site} d={sectorPath(angle)} fill={i === 0 ? p.bg2 : i === 1 ? p.bg1 : "#17132a"} />
        ))}
        {DIAL_SITES.map(({ site, angle }) => {
          const edge = dialPoint(DIAL_RADIUS, angle + 60);
          return (
            <path key={site} d={`M100,100 L${edge.x},${edge.y}`} stroke={p.rim} strokeOpacity={0.55} strokeWidth={1.5} />
          );
        })}
        {DIAL_SITES.map(({ site, angle }) => {
          const badge = dialPoint(58, angle);
          return (
            <g key={site} transform={`translate(${badge.x} ${badge.y}) rotate(${angle})`}>
              <circle r="17" fill="#07060c" stroke="#c9bcff" strokeOpacity={0.6} strokeWidth={1.5} />
              <text y="8" textAnchor="middle" fontSize="23" fontWeight={900} fill="#ffffff" fontFamily="'Arial Black', Impact, sans-serif">
                {site}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Moldura fixa: aro, marcações, centro e ponteiro */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id="dial-rim" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={policePalette.rim} />
            <stop offset="0.5" stopColor="#c9bcff" />
            <stop offset="1" stopColor={factionPalette.rim} />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="92" fill="none" stroke="#0b0a12" strokeWidth={12} />
        <circle cx="100" cy="100" r="97" fill="none" stroke="url(#dial-rim)" strokeWidth={2.5} />
        <circle cx="100" cy="100" r="87" fill="none" stroke="url(#dial-rim)" strokeOpacity={0.5} strokeWidth={1} />
        {Array.from({ length: 36 }).map((_, i) => {
          const degrees = i * 10;
          const inner = dialPoint(i % 3 === 0 ? 89 : 91, degrees);
          const outer = dialPoint(94, degrees);
          return (
            <path key={degrees} d={`M${inner.x},${inner.y} L${outer.x},${outer.y}`} stroke="#c9bcff" strokeOpacity={0.4} strokeWidth={1} />
          );
        })}
        <circle cx="100" cy="100" r="15" fill="#07060c" stroke={p.rim} strokeWidth={2} />
        <path d="M100,91 V109 M91,100 H109" stroke={p.rim} strokeWidth={2} strokeLinecap="round" />
        <path
          d="M100,16 L90,-4 H110 Z"
          fill={p.rim}
          stroke="#07060c"
          strokeWidth={2}
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 5px ${p.glow})` }}
        />
      </svg>
    </div>
  );
};

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

/** Miniatura dos seis slots, com o slot sorteado aceso. */
const SlotsGlyph = ({ p }: { p: ArtPalette }) => (
  <svg viewBox="0 0 200 104" className="h-full w-full" aria-hidden="true">
    {Array.from({ length: 6 }).map((_, i) => {
      const lit = i === 4;
      const x = 34 + (i % 3) * 46;
      const y = 4 + Math.floor(i / 3) * 50;
      return (
        <g key={i} style={lit ? { filter: `drop-shadow(0 0 6px ${p.glow})` } : undefined}>
          <rect
            x={x}
            y={y}
            width="40"
            height="46"
            rx="5"
            fill={lit ? p.bg2 : "#0d0b15"}
            stroke={lit ? p.rim : p.accent}
            strokeOpacity={lit ? 1 : 0.35}
            strokeWidth={lit ? 2.5 : 1.5}
          />
          <text
            x={x + 20}
            y={y + 31}
            textAnchor="middle"
            fontSize="22"
            fontWeight={900}
            fill={lit ? "#ffffff" : p.accent}
            fillOpacity={lit ? 1 : 0.3}
            fontFamily="'Arial Black', Impact, sans-serif"
          >
            {i + 1}
          </text>
        </g>
      );
    })}
  </svg>
);

/** Miniatura do mapa: da base até um bombsite pelo corredor. */
const MapGlyph = ({ p }: { p: ArtPalette }) => {
  const baseX = p.team === "police" ? 36 : 164;
  const tokenX = p.team === "police" ? 78 : 122;
  const route = `M${baseX},52 H${tokenX}`;

  return (
    <svg viewBox="0 0 200 104" className="h-full w-full" aria-hidden="true">
      {["A", "B", "C"].map((site, i) => {
        const y = 4 + i * 33;
        return (
          <g key={site}>
            <rect x="70" y={y} width="30" height="30" rx="4" fill={policePalette.bg2} opacity={0.8} />
            <rect x="100" y={y} width="30" height="30" rx="4" fill={factionPalette.bg2} opacity={0.8} />
            <rect x="70" y={y} width="60" height="30" rx="4" fill="none" stroke="#c9bcff" strokeOpacity={0.55} strokeWidth={1.5} />
            <text
              x="100"
              y={y + 21}
              textAnchor="middle"
              fontSize="17"
              fontWeight={900}
              fill="#ffffff"
              fontFamily="'Arial Black', Impact, sans-serif"
            >
              {site}
            </text>
          </g>
        );
      })}
      <path d={route} fill="none" stroke={p.rim} strokeWidth={3} strokeDasharray="5 5" strokeLinecap="round" />
      <circle cx={baseX} cy="52" r="11" fill={p.bg1} stroke={p.accent} strokeWidth={2} />
      <circle cx={tokenX} cy="52" r="8" fill={p.rim} style={{ filter: `drop-shadow(0 0 6px ${p.glow})` }} />
    </svg>
  );
};

const TacticalOption = ({
  gate,
  onClick,
  tag,
  title,
  text,
  p,
  children,
}: {
  gate: { allowed: boolean; highlighted: boolean };
  onClick: () => void;
  tag: string;
  title: string;
  text: string;
  p: ArtPalette;
  children: ReactNode;
}) => (
  // O destaque do tutorial fica fora: o recorte chanfrado cortaria o brilho.
  <div className={`rounded-xl ${gate.highlighted ? HIGHLIGHT_CLASS : ""}`}>
    <button
      onClick={onClick}
      disabled={!gate.allowed}
      className="tactical-cut group block h-full w-full p-[1.5px] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-125 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-30"
      style={{ "--cut": "14px", background: `linear-gradient(160deg, ${p.rim}, ${p.bg2})` } as CSSProperties}
    >
      <span
        className="tactical-cut flex h-full flex-col gap-2 p-3 text-left"
        style={{ "--cut": "13px", background: `linear-gradient(180deg, ${p.bg1}, ${p.bg0})` } as CSSProperties}
      >
        <span className="h-24 w-full">{children}</span>
        <span className="text-[9px] font-bold tracking-[0.3em]" style={{ color: p.rim }}>
          {tag}
        </span>
        <span className="text-base font-black uppercase leading-tight tracking-wider text-white">{title}</span>
        <span className="text-[11px] leading-snug text-zinc-400">{text}</span>
      </span>
    </button>
  </div>
);

/** Moldura dos painéis de ação: chanfrada e com o aro do tabuleiro. */
export const ActionFrame = ({ children }: { children: ReactNode }) => (
  <div className="relative w-full max-w-xl">
    <div
      className="tactical-cut p-[2px]"
      style={{
        "--cut": "22px",
        background: `linear-gradient(90deg, ${policePalette.rim}, #c9bcff, ${factionPalette.rim})`,
      } as CSSProperties}
    >
      <div
        className="tactical-cut p-5"
        style={{ "--cut": "21px", background: "radial-gradient(ellipse at 50% 30%, #17132a, #07060c 75%)" } as CSSProperties}
      >
        {children}
      </div>
    </div>
  </div>
);

const ChoiceButton = ({ onChoose, game }: ChoiceButtonProps) => {
  const theme = useGameTheme(game.state.currentTeam);
  const p = getPalette(game.state.currentTeam);
  const d6Gate = useGate("choose.d6");
  const spinnerGate = useGate("choose.spinner");

  return (
    <div className="animate-in fade-in duration-300">
      <p className="text-center text-[10px] font-bold tracking-[0.4em] text-zinc-400">OPERAÇÃO TÁTICA</p>
      <h2 className={`mb-4 text-center text-2xl font-black uppercase tracking-widest ${theme.text}`}>
        Turno da {game.currentTeamName}
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <TacticalOption
          gate={d6Gate}
          onClick={() => onChoose("d6")}
          tag="DADO"
          title="Posicionar carta"
          text="Sorteie um slot para posicionar ou jogar uma carta."
          p={p}
        >
          <SlotsGlyph p={p} />
        </TacticalOption>

        <TacticalOption
          gate={spinnerGate}
          onClick={() => onChoose("spinner")}
          tag="ROLETA"
          title="Se posicionar"
          text="Gire a roleta e mova seu time para um bombsite."
          p={p}
        >
          <MapGlyph p={p} />
        </TacticalOption>
      </div>
    </div>
  );
};
