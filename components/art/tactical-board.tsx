import { TeamName } from "@/game/game-types";
import { factionPalette, getPalette, policePalette, type ArtPalette } from "./palette";

/* ═══════════════════════════════════════════════
   TACTICAL BOARD — tabuleiro completo, visto de cima
   viewBox 0 0 1940 1300 (paisagem)

   O desenho é feito "em pé" (retrato, 1300x1940) e
   girado 90° no SVG: a polícia fica à esquerda, o mapa
   no meio e a facção à direita. A geometria exportada
   já vem convertida para a paisagem.

   ┌────────────────────────────────┐  y 0
   │ FACÇÃO: slots 3x2 + baralho    │  (metade girada 180°)
   ├────────────────────────────────┤  y 680
   │           BASE FACÇÃO          │
   │  combate │ A │ B │ C │ bomba   │  mapa de FPS simplificado
   │           BASE POLÍCIA         │
   ├────────────────────────────────┤  y 1220
   │ POLÍCIA: slots 3x2 + baralho   │
   └────────────────────────────────┘  y 1900
   ═══════════════════════════════════════════════ */

const P_W = 1300;
const P_H = 1940;

export const BOARD_W = P_H;
export const BOARD_H = P_W;

const ZONE_H = 700;
const MAP_Y = ZONE_H;
const MAP_H = P_H - ZONE_H * 2;
const MAP_CY = MAP_Y + MAP_H / 2;

export const SLOT_W = 210;
export const SLOT_H = 280;
const SLOT_GAP_X = 40;
const SLOT_GAP_Y = 30;
const GRID_W = SLOT_W * 3 + SLOT_GAP_X * 2;
const GRID_H = SLOT_H * 2 + SLOT_GAP_Y;
const GRID_X = (P_W - GRID_W) / 2;
const GRID_Y = 16;

const DECK = { x: GRID_X + GRID_W + 48, y: 196, w: 132, h: 176 };

const NEUTRAL = {
  plate0: "#1b1826",
  plate1: "#0a0910",
  surface: "#09080e",
  ground: "#0d0b13",
  corridor: "#1a1724",
  line: "#ffffff",
  glow: "#7b5cff",
  rim: "#c9bcff",
};

const TITLE_FONT = "'Arial Black', Impact, 'Helvetica Neue', sans-serif";
const MONO_FONT = "ui-monospace, 'Cascadia Mono', Consolas, monospace";

const chamfer = (x: number, y: number, w: number, h: number, c: number) =>
  `M${x + c},${y} L${x + w - c},${y} L${x + w},${y + c} L${x + w},${y + h - c} L${x + w - c},${y + h} L${x + c},${y + h} L${x},${y + h - c} L${x},${y + c} Z`;

/** Espelha um ponto da metade de cima do mapa para a de baixo. */
const mirrorY = (y: number) => P_H - y;

/* ═══════════════════════════════════════════════
   GEOMETRIA PÚBLICA — o palco usa para posicionar
   cartas, peões e enquadrar as câmeras.
   ═══════════════════════════════════════════════ */

export type Rect = { x: number; y: number; w: number; h: number };
export type Point = { x: number; y: number };
export type Bombsite = "A" | "B" | "C";
export type MapSpot = "BASE" | Bombsite;

/** Retrato -> paisagem: (x, y) vira (P_H - y, x). */
const toL = (p: Point): Point => ({ x: P_H - p.y, y: p.x });
const toLRect = (r: Rect): Rect => ({ x: P_H - r.y - r.h, y: r.x, w: r.h, h: r.w });

const pSlot = (team: TeamName, index: number): Rect => {
  const col = index % 3;
  const row = Math.floor(index / 3);
  const x = GRID_X + col * (SLOT_W + SLOT_GAP_X);
  const y = GRID_Y + row * (SLOT_H + SLOT_GAP_Y);

  if (team === "police") return { x, y: ZONE_H + MAP_H + y, w: SLOT_W, h: SLOT_H };
  // Facção: mesma grade girada 180° em torno do centro da sua metade.
  return { x: P_W - x - SLOT_W, y: ZONE_H - y - SLOT_H, w: SLOT_W, h: SLOT_H };
};

const pGrid = (team: TeamName): Rect =>
  team === "police"
    ? { x: GRID_X, y: ZONE_H + MAP_H + GRID_Y, w: GRID_W, h: GRID_H }
    : { x: GRID_X, y: ZONE_H - GRID_Y - GRID_H, w: GRID_W, h: GRID_H };

/** Giro da carta na paisagem para ficar de frente para o seu jogador. */
export const TEAM_CARD_ROTATION: Record<TeamName, number> = { police: 90, faction: -90 };

/** Retângulo do slot `index` (0–5) na paisagem. */
export const slotRect = (team: TeamName, index: number): Rect => toLRect(pSlot(team, index));

/**
 * Enquadramento da grade de um time: centro na paisagem e tamanho
 * visto pelo próprio jogador (largura x profundidade).
 */
export const gridFrame = (team: TeamName) => {
  const r = pGrid(team);
  return { center: toL({ x: r.x + r.w / 2, y: r.y + r.h / 2 }), w: r.w, h: r.h };
};

const SITE_W = 220;
const SITE_H = 220;
const SITE_Y = MAP_CY - SITE_H / 2;
// Na paisagem, x do retrato vira y: A (x pequeno) fica no topo.
const SITE_CX: Record<Bombsite, number> = { A: 285, B: 650, C: 1015 };

const BASE = { x: P_W / 2 - 100, w: 200, h: 78, y: MAP_Y + 12 };
const BASE_SPOT_Y = BASE.y + 46;
const LANE_Y = MAP_Y + 120;

export const MAP_CENTER: Point = toL({ x: P_W / 2, y: MAP_CY });

/** Carta jogada na zona de combate (embaixo do mapa, já na paisagem). */
export const COMBAT_CARD: Rect = { x: MAP_CENTER.x - 96, y: BOARD_H - 136, w: 78, h: 104 };
const BOMB_BOX: Rect = { x: MAP_CENTER.x - 110, y: 30, w: 220, h: 112 };

/** Ponto (retrato) onde o peão de um time fica parado. */
const pSpot = (team: TeamName, spot: MapSpot): Point => {
  const top =
    spot === "BASE"
      ? { x: P_W / 2, y: BASE_SPOT_Y }
      : { x: SITE_CX[spot] + 52, y: SITE_Y + SITE_H * 0.26 };
  return team === "faction" ? top : { x: top.x, y: mirrorY(top.y) };
};

/** Caminho (retrato) da base até um ponto, seguindo os corredores. */
const routeFromBase = (team: TeamName, spot: MapSpot): Point[] => {
  const base = { x: P_W / 2, y: BASE_SPOT_Y };
  let top: Point[];
  if (spot === "BASE") {
    top = [base];
  } else {
    // Desce pelo corredor até a altura do site e entra na metade do time.
    const cx = SITE_CX[spot];
    const end = pSpot("faction", spot);
    top =
      spot === "B"
        ? [base, { x: base.x, y: end.y }, end]
        : [base, { x: base.x, y: LANE_Y }, { x: cx, y: LANE_Y }, { x: cx, y: end.y }, end];
  }
  return team === "faction" ? top : top.map((p) => ({ x: p.x, y: mirrorY(p.y) }));
};

/** Ponto onde o peão fica parado, na paisagem. */
export const spotPoint = (team: TeamName, spot: MapSpot): Point => toL(pSpot(team, spot));

/** Caminho entre dois pontos do mapa, passando pela base (paisagem). */
export const routeBetween = (team: TeamName, from: MapSpot, to: MapSpot): Point[] => {
  if (from === to) return [spotPoint(team, to)];
  const back = routeFromBase(team, from).slice().reverse();
  const forward = routeFromBase(team, to).slice(1);
  return [...back, ...forward].map(toL);
};

/* ───────────── ÍCONES ───────────── */

const ShieldIcon = ({ color, s = 1 }: { color: string; s?: number }) => (
  <path
    d="M0,-11 L9,-7 L8.5,2 Q6,8 0,11 Q-6,8 -8.5,2 L-9,-7 Z"
    fill="none"
    stroke={color}
    strokeWidth={2 / s}
    strokeLinejoin="round"
    transform={`scale(${s})`}
  />
);

const CrosshairIcon = ({ color, s = 1 }: { color: string; s?: number }) => (
  <g fill="none" stroke={color} strokeWidth={2 / s} strokeLinecap="round" transform={`scale(${s})`}>
    <circle r="8" />
    <path d="M0,-12 V-4 M0,12 V4 M-12,0 H-4 M12,0 H4" />
  </g>
);

const TeamIcon = ({ team, color, s }: { team: TeamName; color: string; s?: number }) =>
  team === "police" ? <ShieldIcon color={color} s={s} /> : <CrosshairIcon color={color} s={s} />;

/* ───────────── SLOT ───────────── */

const CardSlot = ({ n, x, y, p }: { n: number; x: number; y: number; p: ArtPalette }) => (
  <g>
    <rect x={x} y={y} width={SLOT_W} height={SLOT_H} rx="16" fill="#0d0b15" />
    <rect x={x} y={y} width={SLOT_W} height={SLOT_H} rx="16" fill={p.bg1} opacity={0.35} />
    <rect x={x} y={y} width={SLOT_W} height={SLOT_H} rx="16" fill="none" stroke={p.accent} strokeOpacity={0.3} strokeWidth={2} />
    <rect
      x={x + 14}
      y={y + 14}
      width={SLOT_W - 28}
      height={SLOT_H - 28}
      rx="10"
      fill="none"
      stroke={p.rim}
      strokeOpacity={0.25}
      strokeWidth={1.5}
      strokeDasharray="8 7"
    />
    <text
      x={x + SLOT_W / 2}
      y={y + SLOT_H / 2 + 52}
      textAnchor="middle"
      fontSize="150"
      fontWeight={900}
      fill={p.rim}
      opacity={0.07}
      fontFamily={TITLE_FONT}
    >
      {n}
    </text>
    <path d={`M${x},${y + 16} Q${x},${y} ${x + 16},${y} H${x + 66} L${x + 50},${y + 38} H${x} Z`} fill={p.accent} />
    <text x={x + 25} y={y + 29} textAnchor="middle" fontSize="25" fontWeight={900} fill={p.bg0} fontFamily={TITLE_FONT}>
      {n}
    </text>
    <path
      d={`M${x + SLOT_W - 40},${y + SLOT_H - 7} H${x + SLOT_W - 16} Q${x + SLOT_W - 7},${y + SLOT_H - 7} ${x + SLOT_W - 7},${y + SLOT_H - 16} V${y + SLOT_H - 40}`}
      fill="none"
      stroke={p.rim}
      strokeOpacity={0.7}
      strokeWidth={2.5}
      strokeLinecap="round"
    />
  </g>
);

/* ───────────── METADE DE UM TIME ─────────────
   Desenhada na orientação da polícia (borda do jogador
   embaixo); a facção usa a mesma metade girada. */

const TeamHalf = ({ team }: { team: TeamName }) => {
  const p = getPalette(team);
  const label = team === "police" ? "POLÍCIA" : "FACÇÃO";
  const bannerY = GRID_Y + GRID_H + 18;

  return (
    <g>
      <rect width={P_W} height={ZONE_H} fill={`url(#half-${team})`} />

      {Array.from({ length: 6 }).map((_, i) => (
        <CardSlot
          key={i}
          n={i + 1}
          p={p}
          x={GRID_X + (i % 3) * (SLOT_W + SLOT_GAP_X)}
          y={GRID_Y + Math.floor(i / 3) * (SLOT_H + SLOT_GAP_Y)}
        />
      ))}

      {/* Baralho do time */}
      {[10, 5].map((o) => (
        <rect key={o} x={DECK.x + o} y={DECK.y + o} width={DECK.w} height={DECK.h} rx="12" fill={p.bg1} opacity={0.65} />
      ))}
      <rect x={DECK.x} y={DECK.y} width={DECK.w} height={DECK.h} rx="12" fill="#0d0b15" stroke={p.accent} strokeOpacity={0.6} strokeWidth={2} />
      <g transform={`translate(${DECK.x + DECK.w / 2} ${DECK.y + DECK.h / 2})`}>
        <TeamIcon team={team} color={p.rim} s={2.6} />
      </g>
      <text
        x={DECK.x + DECK.w / 2}
        y={DECK.y + DECK.h + 34}
        textAnchor="middle"
        fontSize="12"
        fontWeight={800}
        fill={p.rim}
        opacity={0.6}
        fontFamily={MONO_FONT}
        letterSpacing="3"
      >
        BARALHO
      </text>

      {/* Faixa do time, na borda do jogador */}
      <path d={chamfer(GRID_X, bannerY, GRID_W, 44, 12)} fill={p.bg1} opacity={0.85} />
      <path d={chamfer(GRID_X, bannerY, GRID_W, 44, 12)} fill="none" stroke={p.accent} strokeOpacity={0.55} strokeWidth={2} />
      <g transform={`translate(${P_W / 2 - 92} ${bannerY + 22})`}>
        <TeamIcon team={team} color={p.rim} s={1.1} />
      </g>
      <text
        x={P_W / 2 + 14}
        y={bannerY + 31}
        textAnchor="middle"
        fontSize="24"
        fontWeight={900}
        fill={p.rim}
        fontFamily={TITLE_FONT}
        letterSpacing="8"
      >
        {label}
      </text>
    </g>
  );
};

/* ───────────── MAPA ───────────── */

/** Corredores de uma metade do mapa (desenhados na metade de cima). */
const corridorPaths = () => {
  const base = { x: P_W / 2, y: BASE.y + BASE.h };
  const siteTop = SITE_Y;
  return [
    `M${base.x},${base.y} V${LANE_Y} H${SITE_CX.A} V${siteTop}`,
    `M${base.x},${base.y} V${siteTop}`,
    `M${base.x},${LANE_Y} H${SITE_CX.C} V${siteTop}`,
  ];
};

const Corridors = ({ team }: { team: TeamName }) => {
  const p = getPalette(team);
  const flip = team === "police" ? `translate(0 ${P_H}) scale(1 -1)` : undefined;
  return (
    <g transform={flip}>
      {corridorPaths().map((d) => (
        <g key={d}>
          <path d={d} fill="none" stroke="#000000" strokeOpacity={0.5} strokeWidth={66} strokeLinejoin="round" />
          <path d={d} fill="none" stroke={NEUTRAL.corridor} strokeWidth={56} strokeLinejoin="round" />
          <path d={d} fill="none" stroke={p.bg2} strokeOpacity={0.35} strokeWidth={56} strokeLinejoin="round" />
          <path d={d} fill="none" stroke={p.accent} strokeOpacity={0.4} strokeWidth={2} strokeDasharray="3 10" strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
};

const Base = ({ team }: { team: TeamName }) => {
  const p = getPalette(team);
  const y = team === "faction" ? BASE.y : mirrorY(BASE.y + BASE.h);
  const spot = pSpot(team, "BASE");
  return (
    <g>
      <path d={chamfer(BASE.x, y, BASE.w, BASE.h, 16)} fill={p.bg1} />
      <path d={chamfer(BASE.x, y, BASE.w, BASE.h, 16)} fill="none" stroke={p.accent} strokeOpacity={0.8} strokeWidth={2.5} />
      <text
        x={P_W / 2 + 66}
        y={y + BASE.h / 2 + 4}
        textAnchor="middle"
        fontSize="12"
        fontWeight={900}
        fill={p.rim}
        fontFamily={MONO_FONT}
        letterSpacing="4"
        transform={`rotate(-90 ${P_W / 2 + 66} ${y + BASE.h / 2})`}
      >
        BASE
      </text>
      <circle cx={spot.x} cy={spot.y} r="20" fill="none" stroke={p.rim} strokeOpacity={0.6} strokeWidth={2} strokeDasharray="5 4" />
    </g>
  );
};

const Site = ({ site }: { site: Bombsite }) => {
  const x = SITE_CX[site] - SITE_W / 2;
  const y = SITE_Y;
  const half = SITE_H / 2;
  return (
    <g>
      <rect x={x - 6} y={y - 6} width={SITE_W + 12} height={SITE_H + 12} rx="20" fill="#000000" opacity={0.5} />
      {/* Metade da facção (cima) e da polícia (baixo) */}
      <path
        d={`M${x + 16},${y} H${x + SITE_W - 16} Q${x + SITE_W},${y} ${x + SITE_W},${y + 16} V${y + half} H${x} V${y + 16} Q${x},${y} ${x + 16},${y} Z`}
        fill={factionPalette.bg2}
        opacity={0.6}
      />
      <path
        d={`M${x},${y + half} H${x + SITE_W} V${y + SITE_H - 16} Q${x + SITE_W},${y + SITE_H} ${x + SITE_W - 16},${y + SITE_H} H${x + 16} Q${x},${y + SITE_H} ${x},${y + SITE_H - 16} Z`}
        fill={policePalette.bg2}
        opacity={0.6}
      />
      {/* Hachura de área de plantio */}
      <g clipPath={`url(#site-clip-${site})`} opacity={0.12}>
        {Array.from({ length: 16 }).map((_, i) => (
          <path key={i} d={`M${x - 120 + i * 30},${y + SITE_H} L${x + i * 30},${y}`} stroke="#ffffff" strokeWidth={6} />
        ))}
      </g>
      <rect x={x} y={y} width={SITE_W} height={SITE_H} rx="16" fill="none" stroke="url(#rim-split)" strokeWidth={3} />
      <path d={`M${x},${y + half} H${x + SITE_W}`} stroke={NEUTRAL.line} strokeOpacity={0.35} strokeWidth={2} strokeDasharray="10 6" />

      <circle cx={SITE_CX[site] - 50} cy={y + half} r="42" fill="#000000" opacity={0.55} />
      <circle cx={SITE_CX[site] - 50} cy={y + half} r="42" fill="none" stroke={NEUTRAL.rim} strokeOpacity={0.5} strokeWidth={2} />
      <text
        x={SITE_CX[site] - 50}
        y={y + half + 20}
        textAnchor="middle"
        fontSize="56"
        fontWeight={900}
        fill="#ffffff"
        fontFamily={TITLE_FONT}
        transform={`rotate(-90 ${SITE_CX[site] - 50} ${y + half})`}
      >
        {site}
      </text>

      {(["faction", "police"] as TeamName[]).map((team) => {
        const c = pSpot(team, site);
        const tp = getPalette(team);
        return (
          <circle key={team} cx={c.x} cy={c.y} r="22" fill="none" stroke={tp.rim} strokeOpacity={0.7} strokeWidth={2} strokeDasharray="5 4" />
        );
      })}
    </g>
  );
};

const Crate = ({ x, y, s = 40, r = 0 }: { x: number; y: number; s?: number; r?: number }) => (
  <g transform={`rotate(${r} ${x + s / 2} ${y + s / 2})`}>
    <rect x={x + 4} y={y + 6} width={s} height={s} fill="#000000" opacity={0.5} />
    <rect x={x} y={y} width={s} height={s} fill="#2a2333" />
    <rect x={x + 4} y={y + 4} width={s - 8} height={s - 8} fill="none" stroke="#4a3f58" strokeWidth={2} />
    <path d={`M${x + 4},${y + 4} L${x + s - 4},${y + s - 4}`} stroke="#4a3f58" strokeWidth={2} />
    <path d={`M${x},${y} H${x + s}`} stroke={NEUTRAL.rim} strokeOpacity={0.4} strokeWidth={1.5} />
  </g>
);

const MapArea = () => (
  <g>
    <rect y={MAP_Y} width={P_W} height={MAP_H} fill={NEUTRAL.ground} />
    <rect y={MAP_Y} width={P_W} height={MAP_H} fill="url(#map-grid)" />
    <path d={`M0,${MAP_Y} H${P_W} M0,${MAP_Y + MAP_H} H${P_W}`} stroke={NEUTRAL.line} strokeOpacity={0.12} strokeWidth={2} />

    {/* Rota lateral entre os sites */}
    <path
      d={`M${SITE_CX.A},${MAP_CY} H${SITE_CX.C}`}
      fill="none"
      stroke={NEUTRAL.corridor}
      strokeWidth={40}
      strokeOpacity={0.8}
    />

    <Corridors team="faction" />
    <Corridors team="police" />

    <Crate x={438} y={MAP_CY - 92} />
    <Crate x={466} y={MAP_CY + 46} s={34} r={12} />
    <Crate x={812} y={MAP_CY - 86} s={34} r={-10} />
    <Crate x={826} y={MAP_CY + 50} />
    <Crate x={190} y={LANE_Y - 82} s={30} />
    <Crate x={1080} y={mirrorY(LANE_Y) + 50} s={30} r={8} />

    {(["A", "B", "C"] as Bombsite[]).map((s) => (
      <Site key={s} site={s} />
    ))}
    <Base team="faction" />
    <Base team="police" />

  </g>
);

/** Caixas desenhadas direto na paisagem (fora do giro). */
const LandscapeBoxes = () => (
  <g>
    {/* Zona de combate */}
    <rect
      x={COMBAT_CARD.x - 14}
      y={COMBAT_CARD.y - 12}
      width={220}
      height={COMBAT_CARD.h + 24}
      rx="14"
      fill="#050409"
      stroke="url(#rim-split-x)"
      strokeWidth={2.5}
    />
    <rect
      x={COMBAT_CARD.x}
      y={COMBAT_CARD.y}
      width={COMBAT_CARD.w}
      height={COMBAT_CARD.h}
      rx="8"
      fill="none"
      stroke={NEUTRAL.rim}
      strokeOpacity={0.4}
      strokeWidth={2}
      strokeDasharray="7 5"
    />
    <text
      x={COMBAT_CARD.x + COMBAT_CARD.w + 18}
      y={COMBAT_CARD.y + COMBAT_CARD.h / 2 - 4}
      fontSize="13"
      fontWeight={900}
      fill={NEUTRAL.rim}
      opacity={0.8}
      fontFamily={MONO_FONT}
      letterSpacing="2"
    >
      ZONA DE
    </text>
    <text
      x={COMBAT_CARD.x + COMBAT_CARD.w + 18}
      y={COMBAT_CARD.y + COMBAT_CARD.h / 2 + 14}
      fontSize="13"
      fontWeight={900}
      fill={NEUTRAL.rim}
      opacity={0.8}
      fontFamily={MONO_FONT}
      letterSpacing="2"
    >
      COMBATE
    </text>

    {/* Status da bomba */}
    <rect
      x={BOMB_BOX.x}
      y={BOMB_BOX.y}
      width={BOMB_BOX.w}
      height={BOMB_BOX.h}
      rx="14"
      fill="#050409"
      stroke="url(#rim-split-x)"
      strokeWidth={2.5}
    />
    <rect x={BOMB_BOX.x + 18} y={BOMB_BOX.y + 28} width="80" height="56" rx="6" fill="#2e1a22" />
    <rect x={BOMB_BOX.x + 26} y={BOMB_BOX.y + 38} width="64" height="22" rx="3" fill="#1a0004" />
    <text
      x={BOMB_BOX.x + 58}
      y={BOMB_BOX.y + 54}
      textAnchor="middle"
      fontSize="15"
      fontWeight={900}
      fill="#ff3d3d"
      fontFamily={MONO_FONT}
    >
      --:--
    </text>
    <circle cx={BOMB_BOX.x + 84} cy={BOMB_BOX.y + 72} r="3.5" fill="#ff3d3d" />
    <text
      x={BOMB_BOX.x + 116}
      y={BOMB_BOX.y + 52}
      fontSize="14"
      fontWeight={900}
      fill={NEUTRAL.rim}
      opacity={0.85}
      fontFamily={MONO_FONT}
      letterSpacing="2"
    >
      BOMBA
    </text>
    <text
      x={BOMB_BOX.x + 116}
      y={BOMB_BOX.y + 72}
      fontSize="11"
      fontWeight={800}
      fill={NEUTRAL.rim}
      opacity={0.5}
      fontFamily={MONO_FONT}
      letterSpacing="2"
    >
      SEGURA
    </text>
  </g>
);

/* ═══════════════════════════════════════════════
   TABULEIRO
   ═══════════════════════════════════════════════ */

export const TacticalBoard = ({
  focus = null,
  className,
}: {
  /** Time em foco: escurece a metade do oponente. */
  focus?: TeamName | null;
  className?: string;
}) => (
  <svg viewBox={`0 0 ${BOARD_W} ${BOARD_H}`} className={className} role="img" aria-label="Tabuleiro do Card Strike">
    <defs>
      <linearGradient id="plate" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0" stopColor={NEUTRAL.plate0} />
        <stop offset="1" stopColor={NEUTRAL.plate1} />
      </linearGradient>
      <linearGradient id="rim-split" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={factionPalette.rim} />
        <stop offset="0.5" stopColor={NEUTRAL.rim} />
        <stop offset="1" stopColor={policePalette.rim} />
      </linearGradient>
      <linearGradient id="rim-split-x" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={policePalette.rim} />
        <stop offset="0.5" stopColor={NEUTRAL.rim} />
        <stop offset="1" stopColor={factionPalette.rim} />
      </linearGradient>
      {(["police", "faction"] as TeamName[]).map((team) => {
        const p = getPalette(team);
        return (
          <linearGradient key={team} id={`half-${team}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.bg1} stopOpacity="0.15" />
            <stop offset="1" stopColor={p.bg1} stopOpacity="0.7" />
          </linearGradient>
        );
      })}
      {(["A", "B", "C"] as Bombsite[]).map((s) => (
        <clipPath key={s} id={`site-clip-${s}`}>
          <rect x={SITE_CX[s] - SITE_W / 2} y={SITE_Y} width={SITE_W} height={SITE_H} rx="16" />
        </clipPath>
      ))}
      <linearGradient id="streak" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={policePalette.streak} stopOpacity="0" />
        <stop offset="0.3" stopColor={policePalette.streak} stopOpacity="0.8" />
        <stop offset="0.7" stopColor={factionPalette.streak} stopOpacity="0.8" />
        <stop offset="1" stopColor={factionPalette.streak} stopOpacity="0" />
      </linearGradient>
      <filter id="streak-blur" x="-10%" y="-300%" width="120%" height="700%">
        <feGaussianBlur stdDeviation="14" />
      </filter>
      <pattern id="map-grid" width="50" height="50" patternUnits="userSpaceOnUse">
        <path d="M50,0 H0 V50" fill="none" stroke={NEUTRAL.line} strokeOpacity={0.035} strokeWidth={1} />
      </pattern>
      <clipPath id="surface-clip">
        <path d={chamfer(18, 18, P_W - 36, P_H - 36, 40)} />
      </clipPath>
    </defs>

    <g transform={`translate(${P_H} 0) rotate(90)`}>
    <path d={chamfer(0, 0, P_W, P_H, 48)} fill="url(#plate)" />
    <path d={chamfer(2, 2, P_W - 4, P_H - 4, 47)} fill="none" stroke="url(#rim-split)" strokeOpacity={0.6} strokeWidth={4} />

    <g clipPath="url(#surface-clip)">
      <rect width={P_W} height={P_H} fill={NEUTRAL.surface} />
      <rect width={P_W} height={P_H} fill="url(#map-grid)" />

      <g transform={`rotate(180 ${P_W / 2} ${ZONE_H / 2})`}>
        <TeamHalf team="faction" />
      </g>
      <g transform={`translate(0 ${ZONE_H + MAP_H})`}>
        <TeamHalf team="police" />
      </g>
      <MapArea />

      <g filter="url(#streak-blur)" transform={`rotate(-14 ${P_W / 2} ${MAP_CY})`}>
        <rect x="-80" y={MAP_CY - 12} width={P_W + 160} height="24" fill="url(#streak)" opacity={0.45} />
      </g>

      {/* Escurece a metade do oponente quando há foco */}
      <rect
        width={P_W}
        height={ZONE_H}
        fill="#000000"
        style={{ transition: "opacity 700ms ease", opacity: focus === "police" ? 0.65 : 0 }}
      />
      <rect
        y={ZONE_H + MAP_H}
        width={P_W}
        height={ZONE_H}
        fill="#000000"
        style={{ transition: "opacity 700ms ease", opacity: focus === "faction" ? 0.65 : 0 }}
      />
    </g>
    </g>

    <LandscapeBoxes />
  </svg>
);
