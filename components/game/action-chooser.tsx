"use client";

import { ReactNode, useEffect, useRef } from "react";
import { Minimize2 } from "lucide-react";
import { ArtPalette, factionPalette, getPalette, policePalette } from "@/components/art/palette";
import { NoirBackdrop, useSvgId } from "@/components/art/noir";
import { TeamName, Tool } from "@/game/game-types";
import { GameEngine } from "@/game/useGameEngine";
import { useGameTheme } from "@/game/useGameTheme";
import { HIGHLIGHT_CLASS, useGate } from "./tutorial-gate";

/* ═══════════════════════════════════════════════
   ESCOLHA DA AÇÃO
   As duas jogadas do turno são cartas no mesmo
   formato das cartas do jogo (3:4, noir), abertas
   sobre a mesa sem cobri-la. Teclas 1 e 2 escolhem.
   ═══════════════════════════════════════════════ */

const W = 300;
const H = 400;
const TITLE_FONT = "'Arial Black', Impact, 'Helvetica Neue', sans-serif";
const MONO_FONT = "ui-monospace, 'Cascadia Mono', Consolas, monospace";

type Point = [number, number];

/** Ponto (u, v) numa face do cubo: origem e os dois lados da face. */
const onFace = ([ox, oy]: Point, [ux, uy]: Point, [vx, vy]: Point, u: number, v: number): Point => [
  ox + ux * u + vx * v,
  oy + uy * u + vy * v,
];

const PIPS: Record<number, [number, number][]> = {
  2: [[0.27, 0.27], [0.73, 0.73]],
  3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
  5: [[0.26, 0.26], [0.74, 0.26], [0.5, 0.5], [0.26, 0.74], [0.74, 0.74]],
};

/** Dado em perspectiva isométrica, com o 5 para cima. */
const DieArt = ({ p }: { p: ArtPalette }) => {
  const faces: { o: Point; u: Point; v: Point; fill: string; pips: number }[] = [
    { o: [150, 92], u: [64, 37], v: [-64, 37], fill: p.bg2, pips: 5 },
    { o: [86, 129], u: [64, 37], v: [0, 74], fill: p.bg1, pips: 3 },
    { o: [150, 166], u: [64, -37], v: [0, 74], fill: p.bg0, pips: 2 },
  ];
  return (
    <g>
      <ellipse cx="150" cy="252" rx="88" ry="18" fill="#000000" opacity={0.55} />
      {faces.map(({ o, u, v, fill, pips }, i) => {
        const corners = [onFace(o, u, v, 0, 0), onFace(o, u, v, 1, 0), onFace(o, u, v, 1, 1), onFace(o, u, v, 0, 1)];
        return (
          <g key={i}>
            <path
              d={`M${corners.map((c) => c.join(",")).join(" L")} Z`}
              fill={fill}
              stroke={p.rim}
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
            {PIPS[pips].map(([pu, pv]) => {
              const [x, y] = onFace(o, u, v, pu, pv);
              return <ellipse key={`${pu}-${pv}`} cx={x} cy={y} rx={8} ry={i === 0 ? 5 : 7} fill="#ffffff" opacity={i === 0 ? 1 : 0.8} />;
            })}
          </g>
        );
      })}
    </g>
  );
};

const WHEEL_SITES = [
  { site: "A", angle: 0 },
  { site: "B", angle: 120 },
  { site: "C", angle: 240 },
];

const wheelPoint = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return [r * Math.sin(a), -r * Math.cos(a)] as const;
};

/** Roleta deitada na mesa, vista de cima em ângulo. */
const WheelArt = ({ p, id }: { p: ArtPalette; id: string }) => {
  const R = 86;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={policePalette.rim} />
          <stop offset="0.5" stopColor="#c9bcff" />
          <stop offset="1" stopColor={factionPalette.rim} />
        </linearGradient>
      </defs>
      <ellipse cx="150" cy="250" rx="98" ry="20" fill="#000000" opacity={0.55} />
      {/* Espessura do disco */}
      <ellipse cx="150" cy="186" rx={R + 8} ry={(R + 8) * 0.62} fill="#0b0a12" stroke={p.rim} strokeOpacity={0.4} />
      <g transform="translate(150 172) scale(1 0.62)">
        <circle r={R + 8} fill="#0b0a12" stroke={`url(#${id}-rim)`} strokeWidth={4} />
        {WHEEL_SITES.map(({ site, angle }, i) => {
          const [x0, y0] = wheelPoint(R, angle - 60);
          const [x1, y1] = wheelPoint(R, angle + 60);
          return (
            <path
              key={site}
              d={`M0,0 L${x0},${y0} A${R},${R} 0 0 1 ${x1},${y1} Z`}
              fill={i === 0 ? p.bg2 : i === 1 ? p.bg1 : "#17132a"}
              stroke={p.rim}
              strokeOpacity={0.55}
              strokeWidth={1.5}
            />
          );
        })}
        {WHEEL_SITES.map(({ site, angle }) => {
          const [x, y] = wheelPoint(54, angle);
          return (
            <g key={site} transform={`translate(${x} ${y})`}>
              <circle r="21" fill="#07060c" stroke="#c9bcff" strokeOpacity={0.7} strokeWidth={2} />
              <text y="10" textAnchor="middle" fontSize="28" fontWeight={900} fill="#ffffff" fontFamily={TITLE_FONT}>
                {site}
              </text>
            </g>
          );
        })}
        <circle r="13" fill="#07060c" stroke={p.rim} strokeWidth={2.5} />
      </g>
      {/* Ponteiro em pé na borda de trás */}
      <path d="M150,132 L138,104 H162 Z" fill={p.rim} stroke="#07060c" strokeWidth={2} strokeLinejoin="round" />
      <rect x="147" y="76" width="6" height="30" rx="2" fill="#2a2540" stroke={p.rim} strokeOpacity={0.6} />
    </g>
  );
};

/** Carta de uma jogada: arte no centro, nome, descrição e o que ela sorteia. */
const ActionCardArt = ({
  team,
  tag,
  title,
  lines,
  chip,
  hotkey,
  art,
}: {
  team: TeamName;
  tag: string;
  title: string;
  lines: [string, string];
  chip: string;
  hotkey: string;
  art: (p: ArtPalette, id: string) => ReactNode;
}) => {
  const p = getPalette(team);
  const id = useSvgId("action");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-full w-full" aria-hidden="true">
      <defs>
        <clipPath id={`${id}-clip`}>
          <rect width={W} height={H} rx="16" />
        </clipPath>
        <filter id={`${id}-art`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor={p.glow} floodOpacity="0.5" />
        </filter>
        <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.bg0} stopOpacity="0" />
          <stop offset="0.4" stopColor={p.bg0} stopOpacity="0.9" />
          <stop offset="1" stopColor={p.bg0} stopOpacity="1" />
        </linearGradient>
      </defs>

      <g clipPath={`url(#${id}-clip)`}>
        <NoirBackdrop p={p} id={id} width={W} height={H} />
        <g filter={`url(#${id}-art)`}>{art(p, id)}</g>
        <rect y="262" width={W} height="138" fill={`url(#${id}-fade)`} />

        {/* Etiqueta da jogada */}
        <path d="M0,18 L104,18 L94,42 L0,42 Z" fill={p.accent} />
        <text x="14" y="35.5" fontSize="13" fontWeight={900} fill={p.bg0} fontFamily={MONO_FONT} letterSpacing="2">
          {tag}
        </text>

        {/* Tecla de atalho */}
        <g transform="translate(266 30)">
          <rect x="-16" y="-15" width="32" height="30" rx="6" fill="#000000" opacity={0.5} />
          <rect x="-16" y="-15" width="32" height="30" rx="6" fill="none" stroke={p.rim} strokeOpacity={0.7} strokeWidth={1.5} />
          <text y="7" textAnchor="middle" fontSize="18" fontWeight={900} fill={p.rim} fontFamily={MONO_FONT}>
            {hotkey}
          </text>
        </g>

        <g transform="translate(20 300) skewX(-8)">
          <text fontSize={title.length > 13 ? 22 : 25} fontWeight={900} fill="#ffffff" fontFamily={TITLE_FONT} stroke={p.bg0} strokeWidth={0.6}>
            {title}
          </text>
        </g>
        <path d="M20,310 L150,310" stroke={p.accent} strokeWidth={3} strokeLinecap="round" />
        <path d="M156,310 L172,310" stroke={p.accent} strokeWidth={3} strokeLinecap="round" opacity={0.5} />

        {lines.map((line, i) => (
          <text key={i} x="20" y={334 + i * 17} fontSize="13" fill="#d4d4d8" fontFamily={MONO_FONT}>
            {line}
          </text>
        ))}

        <g transform="translate(20 362)">
          <rect width="150" height="24" rx="6" fill="#000000" opacity={0.55} />
          <rect width="150" height="24" rx="6" fill="none" stroke={p.rim} strokeOpacity={0.5} strokeWidth={1.5} />
          <text x="10" y="17" fontSize="12" fontWeight={900} fill={p.rim} fontFamily={MONO_FONT} letterSpacing="1.5">
            {chip}
          </text>
        </g>
      </g>

      <rect x="1.5" y="1.5" width={W - 3} height={H - 3} rx="15" fill="none" stroke={p.rim} strokeOpacity={0.6} strokeWidth={3} />
      <rect x="9" y="9" width={W - 18} height={H - 18} rx="10" fill="none" stroke="#ffffff" strokeOpacity={0.07} />
      <path
        d={`M9,60 V19 Q9,9 19,9 H60 M${W - 60},${H - 9} H${W - 19} Q${W - 9},${H - 9} ${W - 9},${H - 19} V${H - 60}`}
        fill="none"
        stroke={p.rim}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
};

const ActionCard = ({
  label,
  gate,
  tilt,
  onClick,
  children,
}: {
  label: string;
  gate: { allowed: boolean; highlighted: boolean };
  tilt: number;
  onClick: () => void;
  children: ReactNode;
}) => (
  // O destaque do tutorial fica fora do botão, para o brilho não ser cortado.
  <div className={`rounded-2xl ${gate.highlighted ? HIGHLIGHT_CLASS : ""}`} style={{ transform: `rotate(${tilt}deg)` }}>
    <button
      onClick={onClick}
      disabled={!gate.allowed}
      aria-label={label}
      className="block aspect-[3/4] h-[min(300px,40vh)] rounded-2xl drop-shadow-[0_18px_24px_rgba(0,0,0,0.85)] transition-all duration-200 hover:-translate-y-3 hover:scale-[1.04] hover:brightness-125 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  </div>
);

/** Escolha entre posicionar carta (dado) e se posicionar (roleta). */
export const ActionChooser = ({
  game,
  onMinimize,
}: {
  game: GameEngine;
  /** Ausente quando o painel não pode ser minimizado. */
  onMinimize?: () => void;
}) => {
  const team = game.state.currentTeam;
  const theme = useGameTheme(team);
  const d6Gate = useGate("choose.d6");
  const spinnerGate = useGate("choose.spinner");

  const choose = (tool: Tool) => game.dispatch({ type: "SET_TOOL", payload: tool });

  // Teclado: 1 posiciona carta, 2 se posiciona.
  const keys = useRef({ d6Gate, spinnerGate, choose });
  keys.current = { d6Gate, spinnerGate, choose };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = keys.current;
      if (e.key === "1" && k.d6Gate.allowed) k.choose("d6");
      if (e.key === "2" && k.spinnerGate.allowed) k.choose("spinner");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="pointer-events-none flex flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-300">
      <div className="whitespace-nowrap bg-gradient-to-r from-transparent via-black/75 to-transparent px-28 py-2 text-center">
        <p className="text-[10px] font-bold tracking-[0.4em] text-zinc-400">OPERAÇÃO TÁTICA</p>
        <h2 className={`text-2xl font-black uppercase tracking-[0.2em] drop-shadow-lg ${theme.text}`}>
          Turno da {game.currentTeamName}
        </h2>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-300">Escolha sua jogada</p>
      </div>

      <div className="pointer-events-auto flex items-end gap-6">
        <ActionCard label="Posicionar carta: rolar o dado" gate={d6Gate} tilt={-3} onClick={() => choose("d6")}>
          <ActionCardArt
            team={team}
            tag="DADO"
            title="POSICIONAR CARTA"
            lines={["Sorteie um slot para", "posicionar ou jogar."]}
            chip="SLOTS 1 – 6"
            hotkey="1"
            art={(p) => <DieArt p={p} />}
          />
        </ActionCard>
        <ActionCard label="Se posicionar: girar a roleta" gate={spinnerGate} tilt={3} onClick={() => choose("spinner")}>
          <ActionCardArt
            team={team}
            tag="ROLETA"
            title="SE POSICIONAR"
            lines={["Gire a roleta e mova", "seu time a um site."]}
            chip="SITES A · B · C"
            hotkey="2"
            art={(p, id) => <WheelArt p={p} id={id} />}
          />
        </ActionCard>
      </div>

      {onMinimize && (
        <button
          onClick={onMinimize}
          className="pointer-events-auto flex items-center gap-1.5 rounded-md border border-white/10 bg-black/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 backdrop-blur-sm transition-colors hover:text-white"
        >
          <Minimize2 size={12} />
          Minimizar
        </button>
      )}
    </div>
  );
};
