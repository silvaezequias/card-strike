"use client";

import { useEffect, useRef, useState } from "react";
import { TeamName } from "@/game/game-types";
import { Portrait } from "@/components/art/noir";
import { factionPalette, getPalette, policePalette } from "@/components/art/palette";
import { BOARD_EDGE } from "./minimap";

/* ═══════════════════════════════════════════════
   MAP BOARD — tabuleiro menor com o mapa tático
   viewBox 0 0 900 560

   Cada time começa na sua base (polícia à esquerda,
   facção à direita). Os bombsites A, B e C ficam no
   centro, divididos ao meio: cada time ocupa a sua
   metade. No mesmo site, os dois estão em conflito.
   ═══════════════════════════════════════════════ */

export type Bombsite = "A" | "B" | "C";
export type MapSpot = "BASE" | Bombsite;
type Point = { x: number; y: number };

const MAP_W = 900;
const MAP_H = 560;
const MID_Y = MAP_H / 2;

const SITE = { x: 300, w: 300, h: 136 };
const SITE_Y: Record<Bombsite, number> = { A: 36, B: 212, C: 388 };
const siteCenterY = (site: Bombsite) => SITE_Y[site] + SITE.h / 2;
// Letra na parte de cima do site; fichas embaixo, para a linha de conflito não cobrir a letra.
const LETTER_DY = -26;
const TOKEN_DY = 30;
// Distância da ficha até a borda externa do site (cada time na sua ponta).
const TOKEN_INSET = 44;

const BASE = { x: 26, y: MID_Y - 64, w: 100, h: 128 };
const LANE_X = 236;

const CONFLICT = "#ffb020";
const TITLE_FONT = "'Arial Black', Impact, 'Helvetica Neue', sans-serif";
const MONO_FONT = "ui-monospace, 'Cascadia Mono', Consolas, monospace";

/** Espelho horizontal: o lado da facção é o da polícia refletido. */
const side = (team: TeamName, p: Point): Point => (team === "police" ? p : { x: MAP_W - p.x, y: p.y });

/** Onde a ficha do time fica parada. */
const spotPoint = (team: TeamName, spot: MapSpot): Point =>
  spot === "BASE"
    ? side(team, { x: BASE.x + BASE.w / 2, y: MID_Y })
    : side(team, { x: SITE.x + TOKEN_INSET, y: siteCenterY(spot) + TOKEN_DY });

/** Caminho (lado da polícia) da base até um ponto, pelos corredores. */
const routeFromBase = (spot: MapSpot): Point[] => {
  const base = spotPoint("police", "BASE");
  if (spot === "BASE") return [base];
  const end = spotPoint("police", spot);
  return [base, { x: LANE_X, y: MID_Y }, { x: LANE_X, y: end.y }, end];
};

const routeBetween = (team: TeamName, from: MapSpot, to: MapSpot): Point[] => {
  if (from === to) return [spotPoint(team, to)];
  return [...routeFromBase(from).slice().reverse(), ...routeFromBase(to).slice(1)].map((p) => side(team, p));
};

const pct = (p: Point) => ({ left: `${(p.x / MAP_W) * 100}%`, top: `${(p.y / MAP_H) * 100}%` });

const chamfer = (x: number, y: number, w: number, h: number, c: number) =>
  `M${x + c},${y} L${x + w - c},${y} L${x + w},${y + c} L${x + w},${y + h - c} L${x + w - c},${y + h} L${x + c},${y + h} L${x},${y + h - c} L${x},${y + c} Z`;

/* ───────────── ARTE DO MAPA ───────────── */

/** Prédio visto de cima: telhado, sombra e borda iluminada. */
const Building = ({ x, y, w, h }: { x: number; y: number; w: number; h: number }) => (
  <g>
    <rect x={x + 7} y={y + 9} width={w} height={h} rx="4" fill="#000000" opacity={0.55} />
    <rect x={x} y={y} width={w} height={h} rx="4" fill="#1d1928" />
    <rect x={x + 6} y={y + 6} width={w - 12} height={h - 12} rx="2" fill="#262033" />
    <path d={`M${x + 4},${y} H${x + w - 4}`} stroke="#c9bcff" strokeOpacity={0.35} strokeWidth={2} />
    <rect x={x + w * 0.62} y={y + h * 0.22} width={w * 0.18} height={h * 0.2} fill="#141019" />
  </g>
);

const Crate = ({ x, y }: { x: number; y: number }) => (
  <g>
    <rect x={x + 3} y={y + 4} width="16" height="16" fill="#000000" opacity={0.5} />
    <rect x={x} y={y} width="16" height="16" fill="#3a2f45" />
    <path d={`M${x + 2},${y + 2} L${x + 14},${y + 14} M${x + 14},${y + 2} L${x + 2},${y + 14}`} stroke="#5a4a6a" strokeWidth={1.5} />
  </g>
);

const TeamSide = ({ team }: { team: TeamName }) => {
  const p = getPalette(team);
  const base = side(team, { x: BASE.x, y: BASE.y });
  const baseX = team === "police" ? base.x : base.x - BASE.w;
  const spot = spotPoint(team, "BASE");
  const corridors = (["A", "B", "C"] as Bombsite[]).map((s) =>
    routeFromBase(s)
      .map((pt) => side(team, pt))
      .map((pt, i) => `${i === 0 ? "M" : "L"}${pt.x},${pt.y}`)
      .join(" "),
  );

  return (
    <g>
      {corridors.map((d) => (
        <g key={d}>
          <path d={d} fill="none" stroke="#000000" strokeOpacity={0.55} strokeWidth={40} strokeLinejoin="round" />
          <path d={d} fill="none" stroke="#1b1726" strokeWidth={32} strokeLinejoin="round" />
          <path d={d} fill="none" stroke={p.bg2} strokeOpacity={0.4} strokeWidth={32} strokeLinejoin="round" />
          <path d={d} fill="none" stroke={p.accent} strokeOpacity={0.55} strokeWidth={1.5} strokeDasharray="2 7" strokeLinecap="round" />
        </g>
      ))}

      <path d={chamfer(baseX, BASE.y, BASE.w, BASE.h, 14)} fill={p.bg1} />
      <path d={chamfer(baseX, BASE.y, BASE.w, BASE.h, 14)} fill="none" stroke={p.accent} strokeWidth={2.5} />
      <circle cx={spot.x} cy={spot.y} r="17" fill="none" stroke={p.rim} strokeOpacity={0.6} strokeWidth={1.5} strokeDasharray="4 3" />
      <text x={spot.x} y={BASE.y + 22} textAnchor="middle" fontSize="11" fontWeight={900} fill={p.rim} fontFamily={MONO_FONT} letterSpacing="3">
        BASE
      </text>
      <text x={spot.x} y={BASE.y + BASE.h - 12} textAnchor="middle" fontSize="9" fontWeight={800} fill={p.rim} opacity={0.6} fontFamily={MONO_FONT} letterSpacing="2">
        {team === "police" ? "CT" : "TR"}
      </text>
    </g>
  );
};

const Site = ({ site, conflict }: { site: Bombsite; conflict: boolean }) => {
  const y = SITE_Y[site];
  const half = SITE.w / 2;
  const cx = SITE.x + half;
  const cy = siteCenterY(site) + LETTER_DY;
  return (
    <g>
      <rect x={SITE.x - 6} y={y - 6} width={SITE.w + 12} height={SITE.h + 12} rx="16" fill="#000000" opacity={0.55} />
      <path
        d={`M${SITE.x + 14},${y} H${cx} V${y + SITE.h} H${SITE.x + 14} Q${SITE.x},${y + SITE.h} ${SITE.x},${y + SITE.h - 14} V${y + 14} Q${SITE.x},${y} ${SITE.x + 14},${y} Z`}
        fill={policePalette.bg2}
        opacity={0.7}
      />
      <path
        d={`M${cx},${y} H${SITE.x + SITE.w - 14} Q${SITE.x + SITE.w},${y} ${SITE.x + SITE.w},${y + 14} V${y + SITE.h - 14} Q${SITE.x + SITE.w},${y + SITE.h} ${SITE.x + SITE.w - 14},${y + SITE.h} H${cx} Z`}
        fill={factionPalette.bg2}
        opacity={0.7}
      />
      <g clipPath={`url(#map-site-${site})`} opacity={0.14}>
        {Array.from({ length: 16 }).map((_, i) => (
          <path key={i} d={`M${SITE.x - 140 + i * 26},${y + SITE.h} L${SITE.x + i * 26},${y}`} stroke="#ffffff" strokeWidth={5} />
        ))}
      </g>
      <rect
        className={conflict ? "board-conflict" : undefined}
        x={SITE.x}
        y={y}
        width={SITE.w}
        height={SITE.h}
        rx="14"
        fill="none"
        stroke={conflict ? CONFLICT : "url(#map-rim)"}
        strokeWidth={conflict ? 4 : 2.5}
      />
      <path d={`M${cx},${y + 8} V${y + SITE.h - 8}`} stroke="#ffffff" strokeOpacity={0.35} strokeWidth={1.5} strokeDasharray="6 5" />

      <circle cx={cx} cy={cy} r="27" fill="#07060c" stroke="#c9bcff" strokeOpacity={0.5} strokeWidth={1.5} />
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="34" fontWeight={900} fill="#ffffff" fontFamily={TITLE_FONT}>
        {site}
      </text>

      {(["police", "faction"] as TeamName[]).map((team) => {
        const s = spotPoint(team, site);
        return (
          <circle key={team} cx={s.x} cy={s.y} r="17" fill="none" stroke={getPalette(team).rim} strokeOpacity={0.6} strokeWidth={1.5} strokeDasharray="4 3" />
        );
      })}
    </g>
  );
};

const ConflictLine = ({ site }: { site: Bombsite }) => {
  const a = spotPoint("police", site);
  const b = spotPoint("faction", site);
  const labelY = site === "C" ? SITE_Y.C - 16 : SITE_Y[site] + SITE.h + 22;
  return (
    <g className="board-conflict">
      <path d={`M${a.x},${a.y} L${b.x},${b.y}`} stroke={CONFLICT} strokeOpacity={0.3} strokeWidth={14} strokeLinecap="round" />
      <path
        className="board-conflict-dash"
        d={`M${a.x},${a.y} L${b.x},${b.y}`}
        stroke={CONFLICT}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray="14 9"
      />
      <g transform={`translate(${MAP_W / 2} ${labelY})`}>
        <rect x="-74" y="-15" width="148" height="30" rx="8" fill="#1a1000" stroke={CONFLICT} strokeWidth={2} />
        <text y="6" textAnchor="middle" fontSize="15" fontWeight={900} fill={CONFLICT} fontFamily={TITLE_FONT} letterSpacing="3">
          CONFLITO {site}
        </text>
      </g>
    </g>
  );
};

/** C4 plantada no meio do site, entre as duas fichas. */
const BombMarker = ({ site }: { site: Bombsite }) => {
  const x = MAP_W / 2;
  const y = siteCenterY(site) + TOKEN_DY;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="30" fill="#ff2a2a" opacity={0.18} className="animate-pulse" />
      <rect x="-22" y="-14" width="44" height="28" rx="4" fill="#3a1c22" stroke="#ff5a5a" strokeWidth={2} />
      <rect x="-14" y="-8" width="28" height="10" rx="2" fill="#1a0004" />
      <text y="0" textAnchor="middle" fontSize="8" fontWeight={900} fill="#ff4040" fontFamily={MONO_FONT}>
        0:05
      </text>
      <circle cx="14" cy="8" r="3" fill="#ff3030" className="animate-pulse" />
      <path d="M-22,-6 Q-34,-16 -28,-26" fill="none" stroke="#e33a3a" strokeWidth={2} />
    </g>
  );
};

const MapArt = ({ conflict, bomb = null }: { conflict: Bombsite | null; bomb?: Bombsite | null }) => (
  <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
    <defs>
      <radialGradient id="map-ground" cx="0.5" cy="0.45" r="0.75">
        <stop offset="0" stopColor="#17132a" />
        <stop offset="1" stopColor="#07060c" />
      </radialGradient>
      <linearGradient id="map-sides" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={policePalette.bg1} stopOpacity="0.9" />
        <stop offset="0.4" stopColor={policePalette.bg1} stopOpacity="0" />
        <stop offset="0.6" stopColor={factionPalette.bg1} stopOpacity="0" />
        <stop offset="1" stopColor={factionPalette.bg1} stopOpacity="0.9" />
      </linearGradient>
      <linearGradient id="map-rim" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={policePalette.rim} />
        <stop offset="0.5" stopColor="#c9bcff" />
        <stop offset="1" stopColor={factionPalette.rim} />
      </linearGradient>
      <pattern id="map-grid-fine" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M30,0 H0 V30" fill="none" stroke="#ffffff" strokeOpacity={0.045} strokeWidth={1} />
      </pattern>
      <pattern id="map-scan" width="4" height="4" patternUnits="userSpaceOnUse">
        <rect width="4" height="1" fill="#ffffff" opacity="0.025" />
      </pattern>
      {(["A", "B", "C"] as Bombsite[]).map((s) => (
        <clipPath key={s} id={`map-site-${s}`}>
          <rect x={SITE.x} y={SITE_Y[s]} width={SITE.w} height={SITE.h} rx="14" />
        </clipPath>
      ))}
      <clipPath id="map-clip">
        <path d={chamfer(6, 6, MAP_W - 12, MAP_H - 12, 24)} />
      </clipPath>
    </defs>

    <path d={chamfer(0, 0, MAP_W, MAP_H, 28)} fill="#0b0a12" />
    <g clipPath="url(#map-clip)">
      <rect width={MAP_W} height={MAP_H} fill="url(#map-ground)" />
      <rect width={MAP_W} height={MAP_H} fill="url(#map-sides)" />
      <rect width={MAP_W} height={MAP_H} fill="url(#map-grid-fine)" />

      {/* Prédios e cobertura */}
      <Building x={150} y={34} w={120} h={96} />
      <Building x={150} y={430} w={120} h={96} />
      <Building x={630} y={34} w={120} h={96} />
      <Building x={630} y={430} w={120} h={96} />
      <Building x={398} y={184} w={104} h={18} />
      <Building x={398} y={358} w={104} h={18} />
      <Crate x={266} y={150} />
      <Crate x={618} y={392} />
      <Crate x={266} y={394} />
      <Crate x={618} y={150} />

      <TeamSide team="police" />
      <TeamSide team="faction" />
      {(["A", "B", "C"] as Bombsite[]).map((s) => (
        <Site key={s} site={s} conflict={conflict === s} />
      ))}
      {conflict && <ConflictLine site={conflict} />}
      {bomb && <BombMarker site={bomb} />}

      <rect width={MAP_W} height={MAP_H} fill="url(#map-scan)" />
    </g>

    {/* Moldura com cantoneiras */}
    <path
      className={BOARD_EDGE}
      d={chamfer(1.5, 1.5, MAP_W - 3, MAP_H - 3, 27)}
      fill="none"
      stroke="url(#map-rim)"
      strokeWidth={3}
      strokeOpacity={0.8}
    />
    <path d="M14,64 V36 L36,14 H70 M886,64 V36 L864,14 H830 M14,496 V524 L36,546 H70 M886,496 V524 L864,546 H830" fill="none" stroke="#c9bcff" strokeWidth={3} />
    <text x="46" y="31" fontSize="12" fontWeight={900} fill="#c9bcff" opacity={0.75} fontFamily={MONO_FONT} letterSpacing="4">
      MAPA TÁTICO
    </text>
    <g transform="translate(852 34)">
      <circle r="13" fill="none" stroke="#c9bcff" strokeOpacity={0.5} />
      <path d="M0,-10 L4,2 L0,0 L-4,2 Z" fill="#c9bcff" />
      <text y="-17" textAnchor="middle" fontSize="9" fontWeight={900} fill="#c9bcff" fontFamily={MONO_FONT}>
        N
      </text>
    </g>
  </svg>
);

/* ───────────── FICHAS ───────────── */

const TOKEN_SPEED = 0.16; // unidades do mapa por ms

const Token = ({ team, spot, onArrive }: { team: TeamName; spot: MapSpot; onArrive?: () => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const current = useRef<MapSpot>(spot);
  const arriveRef = useRef(onArrive);
  arriveRef.current = onArrive;
  const [walking, setWalking] = useState(false);
  const p = getPalette(team);

  useEffect(() => {
    const el = ref.current;
    if (!el || current.current === spot) return;
    const route = routeBetween(team, current.current, spot);
    current.current = spot;

    const lengths = route.slice(1).map((pt, i) => Math.hypot(pt.x - route[i].x, pt.y - route[i].y));
    const total = lengths.reduce((a, b) => a + b, 0) || 1;
    let walked = 0;
    const keyframes = route.map((pt, i) => {
      if (i > 0) walked += lengths[i - 1];
      return { ...pct(pt), offset: walked / total };
    });

    setWalking(true);
    const duration = Math.max(700, total / TOKEN_SPEED);
    const animation = el.animate(keyframes, { duration, easing: "ease-in-out", fill: "forwards" });
    // O estilo já aponta para o destino; o timer cobre abas em segundo plano.
    let arrived = false;
    const finish = () => {
      if (arrived) return;
      arrived = true;
      animation.cancel();
      setWalking(false);
      arriveRef.current?.();
    };
    animation.onfinish = finish;
    window.setTimeout(finish, duration + 80);
  }, [spot, team]);

  return (
    <div
      ref={ref}
      className="absolute"
      style={{ ...pct(spotPoint(team, spot)), width: "8%", transform: "translate(-50%, -50%)" }}
    >
      <div style={{ animation: walking ? "token-hop 300ms ease-in-out infinite" : undefined }}>
        <div
          className="aspect-square w-full overflow-hidden rounded-full"
          style={{ border: `3px solid ${p.rim}`, boxShadow: `0 0 0 2px #000, 0 0 16px ${p.glow}, 0 6px 10px rgba(0,0,0,0.8)` }}
        >
          <Portrait team={team} crop="head" flip={team === "police"} className="block h-full w-full" />
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   COMPONENTE
   ═══════════════════════════════════════════════ */

const MAX_ZOOM = 2.3;
const ZOOM_PAD = 46;

/**
 * Com a bomba plantada, enquadra a bomba e os dois jogadores. Se eles
 * estiverem espalhados (ex.: um no A e outro no C), não há zoom.
 */
const zoomFrame = (positions: Record<TeamName, MapSpot>, bomb: Bombsite | null) => {
  if (!bomb) return null;
  const points = (["police", "faction"] as TeamName[]).map((t) => spotPoint(t, positions[t]));
  const xs = [SITE.x, SITE.x + SITE.w, ...points.map((p) => p.x)];
  const ys = [SITE_Y[bomb], SITE_Y[bomb] + SITE.h, ...points.map((p) => p.y)];
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  if (minY <= SITE_Y.A + SITE.h && maxY >= SITE_Y.C) return null;

  const minX = Math.min(...xs) - ZOOM_PAD;
  const maxX = Math.max(...xs) + ZOOM_PAD;
  const scale = Math.min(MAP_W / (maxX - minX), MAP_H / (maxY - minY + ZOOM_PAD * 2), MAX_ZOOM);
  if (scale < 1.15) return null;
  return { scale, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
};

/** Transform (origem no canto) que centraliza o enquadramento sem mostrar fora do mapa. */
const zoomTransform = (frame: ReturnType<typeof zoomFrame>) => {
  if (!frame) return "translate(0%, 0%) scale(1)";
  const { scale: s, cx, cy } = frame;
  const clamp = (v: number) => Math.min(0, Math.max(100 - 100 * s, v));
  const tx = clamp(50 - (cx / MAP_W) * 100 * s);
  const ty = clamp(50 - (cy / MAP_H) * 100 * s);
  return `translate(${tx}%, ${ty}%) scale(${s})`;
};

/** Parte do mapa que o tutorial pede para focar. */
export type MapCameraFocus = {
  area: "full" | "side" | "sites" | "A" | "B" | "C" | "base";
  team?: TeamName;
  /** Foco total: escurece o que estiver fora da seleção. */
  dim?: boolean;
};

const focusRect = (focus: MapCameraFocus) => {
  if (focus.area === "full") return null;
  if (focus.area === "side") {
    // Campo do time: base, corredores e os bombsites inteiros.
    const w = SITE.x + SITE.w + 12;
    return { x: focus.team === "faction" ? MAP_W - w - 14 : 14, y: 18, w, h: MAP_H - 36 };
  }
  if (focus.area === "sites") {
    // Os três bombsites juntos (coluna central).
    return { x: SITE.x, y: SITE_Y.A, w: SITE.w, h: SITE_Y.C + SITE.h - SITE_Y.A };
  }
  if (focus.area === "base") {
    const x = focus.team === "faction" ? MAP_W - BASE.x - BASE.w : BASE.x;
    return { x, y: BASE.y, w: BASE.w, h: BASE.h };
  }
  return { x: SITE.x, y: SITE_Y[focus.area], w: SITE.w, h: SITE.h };
};

/** Enquadramento da parte pedida pelo tutorial. */
const focusFrame = (focus: MapCameraFocus) => {
  const r = focusRect(focus);
  if (!r) return null;
  const scale = Math.min(MAP_W / (r.w + 160), MAP_H / (r.h + 140), 2.6);
  // Áreas da altura do mapa (campo da equipe): só o contorno, sem zoom.
  if (scale <= 1) return null;
  return { scale, cx: r.x + r.w / 2, cy: r.y + r.h / 2 };
};

// Recorte no formato chanfrado da moldura.
const MAP_CLIP = "polygon(3.1% 0, 96.9% 0, 100% 5%, 100% 95%, 96.9% 100%, 3.1% 100%, 0 95%, 0 5%)";

export const MapBoard = ({
  positions,
  bomb = null,
  autoZoom = false,
  focus = null,
  className,
  onArrive,
}: {
  positions: Record<TeamName, MapSpot>;
  /** Bombsite com a bomba plantada, se houver. */
  bomb?: Bombsite | null;
  /** Zoom automático na bomba (usado no modo minimapa). */
  autoZoom?: boolean;
  /** Foco pedido pelo tutorial; tem prioridade sobre o zoom automático. */
  focus?: MapCameraFocus | null;
  className?: string;
  onArrive?: (team: TeamName) => void;
}) => {
  const conflict = positions.police !== "BASE" && positions.police === positions.faction ? positions.police : null;
  const transform = zoomTransform(
    focus ? focusFrame(focus) : autoZoom ? zoomFrame(positions, bomb) : null,
  );
  const ring = focus ? focusRect(focus) : null;

  return (
    <div className={className} style={{ perspective: 900 }}>
      <div
        className="relative w-full drop-shadow-[0_18px_30px_rgba(0,0,0,0.85)]"
        style={{ aspectRatio: `${MAP_W} / ${MAP_H}`, transform: "rotateX(22deg)", transformOrigin: "50% 100%" }}
      >
        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: MAP_CLIP }}>
          <div
            className="absolute inset-0"
            style={{ transform, transformOrigin: "0 0", transition: "transform 700ms cubic-bezier(0.4, 0, 0.2, 1)" }}
          >
            <MapArt conflict={conflict} bomb={bomb} />
            {ring && (
              <div
                className="pointer-events-none absolute animate-pulse rounded-xl"
                style={{
                  left: `${((ring.x - 10) / MAP_W) * 100}%`,
                  top: `${((ring.y - 10) / MAP_H) * 100}%`,
                  width: `${((ring.w + 20) / MAP_W) * 100}%`,
                  height: `${((ring.h + 20) / MAP_H) * 100}%`,
                  border: "3px solid #ffd45c",
                  boxShadow: "0 0 18px rgba(255, 212, 92, 0.6)",
                }}
              />
            )}
            {(["faction", "police"] as TeamName[]).map((team) => (
              <Token key={team} team={team} spot={positions[team]} onArrive={() => onArrive?.(team)} />
            ))}
            {ring && focus?.dim && (
              // Foco total: tudo fora da seleção escurece (fichas inclusive).
              <div
                className="pointer-events-none absolute rounded-xl"
                style={{
                  left: `${((ring.x - 10) / MAP_W) * 100}%`,
                  top: `${((ring.y - 10) / MAP_H) * 100}%`,
                  width: `${((ring.w + 20) / MAP_W) * 100}%`,
                  height: `${((ring.h + 20) / MAP_H) * 100}%`,
                  boxShadow: "0 0 0 2000px rgba(0, 0, 0, 0.5)",
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
