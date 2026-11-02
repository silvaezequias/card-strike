"use client";

import { CSSProperties, useEffect, useState } from "react";
import { ArrowLeft, Sun } from "lucide-react";
import { factionPalette, getPalette, policePalette } from "@/components/art/palette";
import { GameEngine } from "@/game/useGameEngine";
import { useGameTheme } from "@/game/useGameTheme";
import { HIGHLIGHT_CLASS, useGate } from "./tutorial-gate";

/* ═══════════════════════════════════════════════
   TABULEIRO DA ROLETA
   Mesa própria, à esquerda das cartas, que só entra
   em cena na hora de girar. O disco fica deitado na
   mesa em 3D e todo mundo vê o giro, inclusive o do bot.
   ═══════════════════════════════════════════════ */

/** Duração do giro (igual à transição do disco). */
export const SPIN_MS = 3000;
/** Tempo com o disco parado, mostrando o site sorteado. */
export const SPIN_READ_MS = 1600;

const TABLE_TILT = 48;
const WHEEL_THICKNESS = 14;

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

/** Site sob o ponteiro com o disco girado `rotation` graus. */
const siteAt = (rotation: number) => {
  const top = (((-rotation % 360) + 360) % 360);
  return DIAL_SITES.reduce((best, s) => {
    const gap = (a: number) => Math.min(Math.abs(a - top), 360 - Math.abs(a - top));
    return gap(s.angle) < gap(best.angle) ? s : best;
  }).site;
};

const Wheel = ({ team, rotation }: { team: "police" | "faction"; rotation: number }) => {
  const p = getPalette(team);
  return (
    <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <circle cx="100" cy="100" r={DIAL_RADIUS + 2} fill="#07060c" />
      <g
        style={{
          transform: `rotate(${rotation}deg)`,
          transformOrigin: "100px 100px",
          transition: `transform ${SPIN_MS}ms cubic-bezier(0.1, 0.8, 0.1, 1)`,
        }}
      >
        {DIAL_SITES.map(({ site, angle }, i) => (
          <path key={site} d={sectorPath(angle)} fill={i === 0 ? p.bg2 : i === 1 ? p.bg1 : "#17132a"} />
        ))}
        {DIAL_SITES.map(({ site, angle }) => {
          const edge = dialPoint(DIAL_RADIUS, angle + 60);
          return (
            <path key={site} d={`M100,100 L${edge.x},${edge.y}`} stroke={p.rim} strokeOpacity={0.6} strokeWidth={1.5} />
          );
        })}
        {DIAL_SITES.map(({ site, angle }) => {
          const badge = dialPoint(56, angle);
          return (
            <g key={site} transform={`translate(${badge.x} ${badge.y}) rotate(${angle})`}>
              <circle r="19" fill="#07060c" stroke="#c9bcff" strokeOpacity={0.7} strokeWidth={1.5} />
              <text y="9" textAnchor="middle" fontSize="26" fontWeight={900} fill="#ffffff" fontFamily="'Arial Black', Impact, sans-serif">
                {site}
              </text>
            </g>
          );
        })}
      </g>

      {/* Aro fixo e marcações */}
      <defs>
        <linearGradient id="roulette-rim" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={policePalette.rim} />
          <stop offset="0.5" stopColor="#c9bcff" />
          <stop offset="1" stopColor={factionPalette.rim} />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="92" fill="none" stroke="#0b0a12" strokeWidth={12} />
      <circle cx="100" cy="100" r="97" fill="none" stroke="url(#roulette-rim)" strokeWidth={2.5} />
      <circle cx="100" cy="100" r="87" fill="none" stroke="url(#roulette-rim)" strokeOpacity={0.5} strokeWidth={1} />
      {Array.from({ length: 36 }).map((_, i) => {
        const degrees = i * 10;
        const inner = dialPoint(i % 3 === 0 ? 89 : 91, degrees);
        const outer = dialPoint(94, degrees);
        return (
          <path key={degrees} d={`M${inner.x},${inner.y} L${outer.x},${outer.y}`} stroke="#c9bcff" strokeOpacity={0.45} strokeWidth={1} />
        );
      })}
      <circle cx="100" cy="100" r="15" fill="#07060c" stroke={p.rim} strokeWidth={2} />
      <path d="M100,91 V109 M91,100 H109" stroke={p.rim} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
};

/** Ponteiro em pé na borda de trás do disco, apontando para o site sorteado. */
const Pointer = ({ color, glow }: { color: string; glow: string }) => (
  <div
    className="absolute left-1/2 top-0"
    style={{
      width: 44,
      height: 70,
      marginLeft: -22,
      marginTop: -58,
      transformOrigin: "50% 100%",
      transform: `translateZ(${WHEEL_THICKNESS}px) rotateX(-90deg)`,
    }}
  >
    <svg viewBox="0 0 44 70" className="h-full w-full overflow-visible" style={{ filter: `drop-shadow(0 0 8px ${glow})` }}>
      <rect x="19" y="0" width="6" height="50" rx="2" fill="#2a2540" stroke={color} strokeOpacity={0.6} />
      <path d="M4,40 H40 L22,70 Z" fill={color} stroke="#07060c" strokeWidth={2} strokeLinejoin="round" />
    </svg>
  </div>
);

export const RouletteBoard = ({
  game,
  className = "",
}: {
  game: GameEngine;
  className?: string;
}) => {
  const { currentTeam, tool, teams } = game.state;
  const p = getPalette(currentTeam);
  const theme = useGameTheme(currentTeam);
  const rotation = game.tool.rotation.spinner.z;
  const spinning = tool.isRolling && tool.selected === "spinner";

  // O nome do site aparece quando o disco para e fica até a mesa sair de cena.
  const [stopped, setStopped] = useState(false);
  const chosen = tool.selected === "spinner";
  useEffect(() => {
    if (chosen && !spinning) setStopped(false);
  }, [chosen, spinning]);
  useEffect(() => {
    if (!spinning) return;
    setStopped(false);
    const timer = window.setTimeout(() => setStopped(true), SPIN_MS);
    return () => window.clearTimeout(timer);
  }, [spinning, rotation]);

  const tableStyle: CSSProperties = {
    transform: `rotateX(${TABLE_TILT}deg)`,
    transformStyle: "preserve-3d",
    background: `radial-gradient(circle at 50% 45%, ${p.bg1} 0%, #0a0812 55%, #050409 100%)`,
    boxShadow: `0 40px 80px rgba(0,0,0,0.8), inset 0 0 0 2px ${p.rim}55, inset 0 0 90px ${p.glow}22`,
  };

  return (
    <div className={`relative flex h-full w-full flex-col items-center justify-center ${className}`}>
      <div className="pointer-events-none mb-2 text-center">
        <p className="text-[10px] font-bold tracking-[0.4em] text-zinc-400">ROLETA DOS BOMBSITES</p>
        <h2 className={`text-2xl font-black uppercase tracking-[0.2em] drop-shadow-lg ${theme.text}`}>
          {stopped
            ? `${teams[currentTeam].playerName} vai para o site ${siteAt(rotation)}`
            : spinning
              ? `${teams[currentTeam].playerName} está girando...`
              : `Vez de ${teams[currentTeam].playerName} se posicionar`}
        </h2>
      </div>

      <div className="relative" style={{ perspective: 1400, width: "min(62vh, 70vw)", aspectRatio: "1" }}>
        {/* Mesa */}
        {/* Sem clip-path nem overflow: os dois achatariam o 3D dos filhos. */}
        <div className="absolute inset-0 rounded-[48px]" style={tableStyle}>
          {/* Grade da mesa */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full opacity-30" aria-hidden="true">
            {Array.from({ length: 9 }).map((_, i) => (
              <g key={i} stroke="#c9bcff" strokeWidth={0.15}>
                <path d={`M${(i + 1) * 10},0 V100`} />
                <path d={`M0,${(i + 1) * 10} H100`} />
              </g>
            ))}
          </svg>
          {/* Faixas das cores dos times nas bordas */}
          <div className="absolute inset-x-[12%] top-[3%] h-1 rounded-full" style={{ background: `linear-gradient(90deg, ${policePalette.rim}, #c9bcff, ${factionPalette.rim})` }} />
          <div className="absolute inset-x-[12%] bottom-[3%] h-1 rounded-full" style={{ background: `linear-gradient(90deg, ${policePalette.rim}, #c9bcff, ${factionPalette.rim})` }} />

          {/* Disco: camadas empilhadas fazem a espessura */}
          <div className="absolute inset-[12%]" style={{ transformStyle: "preserve-3d" }}>
            {Array.from({ length: WHEEL_THICKNESS / 2 }).map((_, i) => (
              <div
                key={i}
                className="absolute inset-0 rounded-full"
                style={{
                  transform: `translateZ(${i * 2}px)`,
                  background: i === 0 ? "rgba(0,0,0,0.6)" : "#16122a",
                  boxShadow: i === 0 ? "0 0 40px 10px rgba(0,0,0,0.7)" : `inset 0 0 0 2px ${p.rim}44`,
                }}
              />
            ))}
            <div className="absolute inset-0" style={{ transform: `translateZ(${WHEEL_THICKNESS}px)` }}>
              <Wheel team={currentTeam} rotation={rotation} />
            </div>
            <Pointer color={p.rim} glow={p.glow} />
          </div>
        </div>
      </div>
    </div>
  );
};

/** Botões da roleta para quem joga: girar e voltar. */
export const RouletteDock = ({ game }: { game: GameEngine }) => {
  const theme = useGameTheme(game.state.currentTeam);
  const rollGate = useGate("roll");
  const backGate = useGate("back");
  const { isRolling } = game.state.tool;

  return (
    <div className="pointer-events-auto absolute bottom-14 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2">
      <button
        disabled={isRolling || !backGate.allowed}
        onClick={() => game.dispatch({ type: "SELECT_ACTION" })}
        className="flex items-center gap-2 rounded-lg border border-white/15 bg-black/60 px-3 py-3 text-xs font-bold uppercase tracking-widest text-zinc-300 backdrop-blur-sm transition-colors hover:text-white disabled:hidden"
      >
        <ArrowLeft size={14} />
        Voltar
      </button>
      <button
        onClick={() => game.tool.roll()}
        disabled={isRolling || !rollGate.allowed}
        className={`${rollGate.highlighted ? HIGHLIGHT_CLASS : ""} flex items-center gap-2 rounded-lg border-2 ${theme.border} bg-black/70 px-6 py-3 text-sm font-black uppercase tracking-widest text-white backdrop-blur-sm transition-transform active:scale-95 disabled:opacity-50`}
      >
        <Sun size={18} />
        {isRolling ? "Girando..." : "Girar roleta"}
      </button>
    </div>
  );
};
