import { TeamName } from "@/game/game-types";
import { factionPalette, getPalette, policePalette, type ArtPalette } from "./palette";

/* ═══════════════════════════════════════════════
   TACTICAL BOARD — tabuleiro de cartas, visto de cima
   viewBox 0 0 1700 1000 (paisagem)

   ┌──────────────────────────────────────────────┐
   │        [bomba]                [baralho FAC]  │
   │ POL │ slots POL │ combate │ slots FAC │ FAC  │
   │  [baralho POL]                               │
   └──────────────────────────────────────────────┘

   A polícia joga pela esquerda e a facção pela direita.
   As cartas da facção são as da polícia giradas 180°,
   então cada jogador lê a sua grade. O mapa (bases,
   bombsites e peões) fica no tabuleiro menor, MapBoard.
   ═══════════════════════════════════════════════ */

export const BOARD_W = 1700;
export const BOARD_H = 1000;

export type Rect = { x: number; y: number; w: number; h: number };
export type Point = { x: number; y: number };

const NEUTRAL = {
  plate0: "#1b1826",
  plate1: "#0a0910",
  surface: "#09080e",
  line: "#ffffff",
  glow: "#7b5cff",
  rim: "#c9bcff",
};

const TITLE_FONT = "'Arial Black', Impact, 'Helvetica Neue', sans-serif";
const MONO_FONT = "ui-monospace, 'Cascadia Mono', Consolas, monospace";

const chamfer = (x: number, y: number, w: number, h: number, c: number) =>
  `M${x + c},${y} L${x + w - c},${y} L${x + w},${y + c} L${x + w},${y + h - c} L${x + w - c},${y + h} L${x + c},${y + h} L${x},${y + h - c} L${x},${y + c} Z`;

/* ═══════════════════════════════════════════════
   GEOMETRIA — definida no lado da polícia e girada
   180° para a facção.
   ═══════════════════════════════════════════════ */

const mirrorRect = (r: Rect): Rect => ({ x: BOARD_W - r.x - r.w, y: BOARD_H - r.y - r.h, w: r.w, h: r.h });
const forTeam = (team: TeamName, r: Rect) => (team === "police" ? r : mirrorRect(r));
const pointForTeam = (team: TeamName, p: Point) =>
  team === "police" ? p : { x: BOARD_W - p.x, y: BOARD_H - p.y };

/** Giro da carta para ficar de frente para o seu jogador. */
export const TEAM_CARD_ROTATION: Record<TeamName, number> = { police: 90, faction: -90 };

// Carta em pé tem 3:4; deitada no tabuleiro ocupa SLOT_H x SLOT_W.
const SLOT_W = 170;
const SLOT_H = 227;
const SLOT_GAP = 24;
const GRID_DEPTH = SLOT_H * 2 + SLOT_GAP; // na direção do jogador
const GRID_ACROSS = SLOT_W * 3 + SLOT_GAP * 2; // de lado a lado
const GRID_X = 140;
const GRID_Y = (BOARD_H - GRID_ACROSS) / 2;

/** Centro do tabuleiro (foco da visão geral). */
export const MAP_CENTER: Point = { x: BOARD_W / 2, y: BOARD_H / 2 };

/**
 * Slot `index` (0–5). Da visão do jogador: 1–3 na fileira de trás,
 * 4–6 na da frente, da esquerda para a direita.
 */
export const slotRect = (team: TeamName, index: number): Rect => {
  const col = index % 3;
  const row = Math.floor(index / 3);
  return forTeam(team, {
    x: GRID_X + (1 - row) * (SLOT_H + SLOT_GAP),
    y: GRID_Y + col * (SLOT_W + SLOT_GAP),
    w: SLOT_H,
    h: SLOT_W,
  });
};

/** Enquadramento da grade: centro e tamanho visto pelo próprio jogador. */
export const gridFrame = (team: TeamName) => ({
  center: pointForTeam(team, { x: GRID_X + GRID_DEPTH / 2, y: BOARD_H / 2 }),
  w: GRID_ACROSS,
  h: GRID_DEPTH,
});

/** Baralho do time, à direita de quem joga. */
export const deckRect = (team: TeamName): Rect =>
  forTeam(team, { x: GRID_X + GRID_DEPTH / 2 - 88, y: GRID_Y + GRID_ACROSS + 34, w: 176, h: 132 });

/** Carta jogada na zona de combate, no centro da mesa. */
export const COMBAT_CARD: Rect = { x: MAP_CENTER.x - 66, y: MAP_CENTER.y - 88, w: 132, h: 176 };
export const BOMB_BOX: Rect = { x: MAP_CENTER.x - 92, y: 70, w: 184, h: 112 };

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

/** Desenha `children` em pé (retrato) centrado num retângulo, de frente para o time. */
const FacingTeam = ({ rect, team, children }: { rect: Rect; team: TeamName; children: React.ReactNode }) => (
  <g transform={`translate(${rect.x + rect.w / 2} ${rect.y + rect.h / 2}) rotate(${TEAM_CARD_ROTATION[team]})`}>
    {children}
  </g>
);

/* ───────────── SLOTS E BARALHO ───────────── */

/** Slot desenhado em pé, centrado na origem. */
const CardSlot = ({ n, p }: { n: number; p: ArtPalette }) => {
  const x = -SLOT_W / 2;
  const y = -SLOT_H / 2;
  return (
    <g>
      <rect x={x} y={y} width={SLOT_W} height={SLOT_H} rx="14" fill="#0d0b15" />
      <rect x={x} y={y} width={SLOT_W} height={SLOT_H} rx="14" fill={p.bg1} opacity={0.35} />
      <rect x={x} y={y} width={SLOT_W} height={SLOT_H} rx="14" fill="none" stroke={p.accent} strokeOpacity={0.3} strokeWidth={2} />
      <rect
        x={x + 12}
        y={y + 12}
        width={SLOT_W - 24}
        height={SLOT_H - 24}
        rx="9"
        fill="none"
        stroke={p.rim}
        strokeOpacity={0.25}
        strokeWidth={1.5}
        strokeDasharray="7 6"
      />
      <text y="44" textAnchor="middle" fontSize="120" fontWeight={900} fill={p.rim} opacity={0.07} fontFamily={TITLE_FONT}>
        {n}
      </text>
      <path d={`M${x},${y + 14} Q${x},${y} ${x + 14},${y} H${x + 56} L${x + 42},${y + 32} H${x} Z`} fill={p.accent} />
      <text x={x + 21} y={y + 24} textAnchor="middle" fontSize="21" fontWeight={900} fill={p.bg0} fontFamily={TITLE_FONT}>
        {n}
      </text>
    </g>
  );
};

const TeamCards = ({ team }: { team: TeamName }) => {
  const p = getPalette(team);
  const deck = deckRect(team);
  const grid = forTeam(team, { x: GRID_X, y: GRID_Y, w: GRID_DEPTH, h: GRID_ACROSS });
  // Faixa com o nome do time, na borda de quem joga.
  const banner = forTeam(team, { x: 50, y: GRID_Y, w: 56, h: GRID_ACROSS });

  return (
    <g>
      <path
        d={chamfer(grid.x - 18, grid.y - 18, grid.w + 36, grid.h + 36, 18)}
        fill={p.bg1}
        opacity={0.45}
        stroke={p.accent}
        strokeOpacity={0.35}
        strokeWidth={2}
      />
      {Array.from({ length: 6 }).map((_, i) => (
        <FacingTeam key={i} rect={slotRect(team, i)} team={team}>
          <CardSlot n={i + 1} p={p} />
        </FacingTeam>
      ))}

      {/* Baralho */}
      <FacingTeam rect={deck} team={team}>
        {[10, 5].map((o) => (
          <rect key={o} x={-66 + o} y={-88 + o} width="132" height="176" rx="12" fill={p.bg1} opacity={0.65} />
        ))}
        <rect x="-66" y="-88" width="132" height="176" rx="12" fill="#0d0b15" stroke={p.accent} strokeOpacity={0.6} strokeWidth={2} />
        <g transform="translate(0 -14)">
          <TeamIcon team={team} color={p.rim} s={2.4} />
        </g>
        <text y="58" textAnchor="middle" fontSize="12" fontWeight={800} fill={p.rim} opacity={0.65} fontFamily={MONO_FONT} letterSpacing="3">
          BARALHO
        </text>
      </FacingTeam>

      {/* Nome do time */}
      <path d={chamfer(banner.x, banner.y, banner.w, banner.h, 12)} fill={p.bg1} opacity={0.85} />
      <path d={chamfer(banner.x, banner.y, banner.w, banner.h, 12)} fill="none" stroke={p.accent} strokeOpacity={0.55} strokeWidth={2} />
      <FacingTeam rect={banner} team={team}>
        <g transform="translate(-98 0)">
          <TeamIcon team={team} color={p.rim} s={1.1} />
        </g>
        <text x="12" y="9" textAnchor="middle" fontSize="24" fontWeight={900} fill={p.rim} fontFamily={TITLE_FONT} letterSpacing="8">
          {team === "police" ? "POLÍCIA" : "FACÇÃO"}
        </text>
      </FacingTeam>
    </g>
  );
};

/* ───────────── CENTRO ───────────── */

const Center = () => (
  <g>
    <circle cx={MAP_CENTER.x} cy={MAP_CENTER.y} r="190" fill="url(#zone-glow)" />
    <rect
      x={COMBAT_CARD.x - 22}
      y={COMBAT_CARD.y - 46}
      width={COMBAT_CARD.w + 44}
      height={COMBAT_CARD.h + 92}
      rx="16"
      fill="#050409"
      stroke="url(#rim-split)"
      strokeWidth={3}
    />
    <rect
      x={COMBAT_CARD.x}
      y={COMBAT_CARD.y}
      width={COMBAT_CARD.w}
      height={COMBAT_CARD.h}
      rx="10"
      fill="none"
      stroke={NEUTRAL.rim}
      strokeOpacity={0.45}
      strokeWidth={2}
      strokeDasharray="8 6"
    />
    <text
      x={MAP_CENTER.x}
      y={COMBAT_CARD.y - 18}
      textAnchor="middle"
      fontSize="14"
      fontWeight={900}
      fill={NEUTRAL.rim}
      opacity={0.8}
      fontFamily={MONO_FONT}
      letterSpacing="3"
    >
      COMBATE
    </text>

    {/* Status da bomba */}
    <rect x={BOMB_BOX.x} y={BOMB_BOX.y} width={BOMB_BOX.w} height={BOMB_BOX.h} rx="14" fill="#050409" stroke="url(#rim-split)" strokeWidth={2.5} />
    <rect x={BOMB_BOX.x + 16} y={BOMB_BOX.y + 28} width="74" height="56" rx="6" fill="#2e1a22" />
    <rect x={BOMB_BOX.x + 23} y={BOMB_BOX.y + 38} width="60" height="22" rx="3" fill="#1a0004" />
    <text x={BOMB_BOX.x + 53} y={BOMB_BOX.y + 54} textAnchor="middle" fontSize="14" fontWeight={900} fill="#ff3d3d" fontFamily={MONO_FONT}>
      --:--
    </text>
    <circle cx={BOMB_BOX.x + 78} cy={BOMB_BOX.y + 72} r="3.5" fill="#ff3d3d" />
    <text x={BOMB_BOX.x + 104} y={BOMB_BOX.y + 52} fontSize="13" fontWeight={900} fill={NEUTRAL.rim} opacity={0.85} fontFamily={MONO_FONT} letterSpacing="2">
      BOMBA
    </text>
    <text x={BOMB_BOX.x + 104} y={BOMB_BOX.y + 72} fontSize="10" fontWeight={800} fill={NEUTRAL.rim} opacity={0.5} fontFamily={MONO_FONT} letterSpacing="2">
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
  /** Time em foco: escurece o lado do oponente. */
  focus?: TeamName | null;
  className?: string;
}) => (
  <svg viewBox={`0 0 ${BOARD_W} ${BOARD_H}`} className={className} role="img" aria-label="Tabuleiro do Card Strike">
    <defs>
      <linearGradient id="plate" x1="0" y1="0" x2="1" y2="0.3">
        <stop offset="0" stopColor={NEUTRAL.plate0} />
        <stop offset="1" stopColor={NEUTRAL.plate1} />
      </linearGradient>
      <linearGradient id="rim-split" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={policePalette.rim} />
        <stop offset="0.5" stopColor={NEUTRAL.rim} />
        <stop offset="1" stopColor={factionPalette.rim} />
      </linearGradient>
      <linearGradient id="sides" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={policePalette.bg1} stopOpacity="0.85" />
        <stop offset="0.45" stopColor={policePalette.bg1} stopOpacity="0.1" />
        <stop offset="0.55" stopColor={factionPalette.bg1} stopOpacity="0.1" />
        <stop offset="1" stopColor={factionPalette.bg1} stopOpacity="0.85" />
      </linearGradient>
      <radialGradient id="zone-glow">
        <stop offset="0.4" stopColor={NEUTRAL.glow} stopOpacity="0.3" />
        <stop offset="1" stopColor={NEUTRAL.glow} stopOpacity="0" />
      </radialGradient>
      <linearGradient id="streak" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={policePalette.streak} stopOpacity="0" />
        <stop offset="0.3" stopColor={policePalette.streak} stopOpacity="0.8" />
        <stop offset="0.7" stopColor={factionPalette.streak} stopOpacity="0.8" />
        <stop offset="1" stopColor={factionPalette.streak} stopOpacity="0" />
      </linearGradient>
      <filter id="streak-blur" x="-10%" y="-300%" width="120%" height="700%">
        <feGaussianBlur stdDeviation="16" />
      </filter>
      <pattern id="map-grid" width="50" height="50" patternUnits="userSpaceOnUse">
        <path d="M50,0 H0 V50" fill="none" stroke={NEUTRAL.line} strokeOpacity={0.035} strokeWidth={1} />
      </pattern>
      <clipPath id="surface-clip">
        <path d={chamfer(18, 18, BOARD_W - 36, BOARD_H - 36, 40)} />
      </clipPath>
    </defs>

    <path d={chamfer(0, 0, BOARD_W, BOARD_H, 48)} fill="url(#plate)" />
    <path
      className="transition-[stroke-width,stroke-opacity] duration-200 group-hover:[stroke-width:12] group-hover:[stroke-opacity:1]"
      d={chamfer(2, 2, BOARD_W - 4, BOARD_H - 4, 47)}
      fill="none"
      stroke="url(#rim-split)"
      strokeOpacity={0.6}
      strokeWidth={4}
    />

    <g clipPath="url(#surface-clip)">
      <rect width={BOARD_W} height={BOARD_H} fill={NEUTRAL.surface} />
      <rect width={BOARD_W} height={BOARD_H} fill="url(#sides)" />
      <rect width={BOARD_W} height={BOARD_H} fill="url(#map-grid)" />

      <TeamCards team="police" />
      <TeamCards team="faction" />
      <Center />

      <g filter="url(#streak-blur)" transform={`rotate(-8 ${MAP_CENTER.x} ${MAP_CENTER.y})`}>
        <rect x="-80" y={MAP_CENTER.y - 14} width={BOARD_W + 160} height="28" fill="url(#streak)" opacity={0.4} />
      </g>

      {/* Escurece o lado do oponente quando há foco */}
      <rect
        x={MAP_CENTER.x + 110}
        width={BOARD_W / 2}
        height={BOARD_H}
        fill="#000000"
        style={{ transition: "opacity 700ms ease", opacity: focus === "police" ? 0.6 : 0 }}
      />
      <rect
        width={MAP_CENTER.x - 110}
        height={BOARD_H}
        fill="#000000"
        style={{ transition: "opacity 700ms ease", opacity: focus === "faction" ? 0.6 : 0 }}
      />
    </g>
  </svg>
);
