"use client";

import { TeamName } from "@/game/game-types";
import { Card } from "@/lib/types";
import { TEAM_CHARACTERS } from "./characters";
import { ITEM_ART } from "./items";
import { NoirBackdrop, useSvgId } from "./noir";
import { ArtPalette, getPalette } from "./palette";

/* ═══════════════════════════════════════════════
   NOIR CARD — viewBox 0 0 300 400 (3:4)
   Escala com o contêiner, então serve tanto na mão
   quanto no octógono central.
   ═══════════════════════════════════════════════ */

const W = 300;
const H = 400;

const CATEGORY_LABEL: Record<Card["cardCategory"], string> = {
  ARMA: "ARMA",
  BOMBA: "BOMBA",
  DIVERSOS: "UTILITÁRIO",
};

const STAT_COLORS = {
  damage: "#ff5c70",
  healing: "#5cffa8",
  duration: "#ffd45c",
};

const TITLE_FONT = "'Arial Black', Impact, 'Helvetica Neue', sans-serif";
const MONO_FONT = "ui-monospace, 'Cascadia Mono', Consolas, monospace";

const HeartIcon = ({ color }: { color: string }) => (
  <path
    d="M12 21s-7-4.4-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.6-9.5 9-9.5 9z"
    fill={color}
  />
);

const ClockIcon = ({ color }: { color: string }) => (
  <g fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round">
    <circle cx="12" cy="13" r="8.5" />
    <path d="M12 8.5V13l3 2" />
  </g>
);

const TeamEmblem = ({ team, color, size }: { team: TeamName; color: string; size: number }) =>
  team === "police" ? (
    <path
      d={`M0,${-size} L${size * 0.85},${-size * 0.62} L${size * 0.78},${size * 0.2} Q${size * 0.55},${size * 0.75} 0,${size} Q${-size * 0.55},${size * 0.75} ${-size * 0.78},${size * 0.2} L${-size * 0.85},${-size * 0.62} Z`}
      fill="none"
      stroke={color}
      strokeWidth={size * 0.08}
      strokeLinejoin="round"
    />
  ) : (
    <g fill="none" stroke={color} strokeWidth={size * 0.08} strokeLinecap="round">
      <circle r={size * 0.72} />
      <circle r={size * 0.18} />
      <path
        d={`M0,${-size} V${-size * 0.38} M0,${size} V${size * 0.38} M${-size},0 H${-size * 0.38} M${size},0 H${size * 0.38}`}
      />
    </g>
  );

type Stat = { key: keyof typeof STAT_COLORS; label: string };

const getStats = (card: Card): Stat[] => {
  const stats: Stat[] = [];
  if (card.damage > 0) stats.push({ key: "damage", label: `-${card.damage}` });
  if (card.healing > 0) stats.push({ key: "healing", label: `+${card.healing}` });
  if (card.duration > 0) stats.push({ key: "duration", label: `${card.duration}R` });
  return stats;
};

const StatChips = ({ card, p }: { card: Card; p: ArtPalette }) => {
  const stats = getStats(card);

  if (stats.length === 0) {
    return (
      <text
        x="22"
        y="372"
        fontSize="15"
        fontWeight={800}
        fill={p.rim}
        fontFamily={MONO_FONT}
        letterSpacing="2"
      >
        USO ÚNICO
      </text>
    );
  }

  return (
    <g>
      {stats.map((stat, i) => {
        const color = STAT_COLORS[stat.key];
        const x = 18 + i * 90;
        return (
          <g key={stat.key} transform={`translate(${x} 346)`}>
            <rect width="82" height="36" rx="7" fill="#000000" opacity={0.55} />
            <rect width="82" height="36" rx="7" fill="none" stroke={color} strokeOpacity={0.5} strokeWidth={1.5} />
            <g transform="translate(8 6)">
              {stat.key === "duration" ? <ClockIcon color={color} /> : <HeartIcon color={color} />}
            </g>
            <text
              x="38"
              y="26"
              fontSize="21"
              fontWeight={900}
              fill={color}
              fontFamily={MONO_FONT}
            >
              {stat.label}
            </text>
          </g>
        );
      })}
    </g>
  );
};

export const NoirCard = ({
  card,
  team,
  className,
}: {
  card: Card;
  team: TeamName;
  className?: string;
}) => {
  const p = getPalette(team);
  const id = useSvgId("card");
  const art = ITEM_ART[card.name];
  const name = card.name.toUpperCase();
  const titleSize = name.length > 10 ? 25 : name.length > 7 ? 29 : 34;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      role="img"
      aria-label={`${card.name}: ${card.description}`}
    >
      <title>{`${card.name} — ${card.description}`}</title>
      <defs>
        <clipPath id={`${id}-clip`}>
          <rect width={W} height={H} rx="16" />
        </clipPath>
        <filter id={`${id}-art`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor={p.glow} floodOpacity="0.55" />
          <feDropShadow dx="-6" dy="10" stdDeviation="5" floodColor="#000000" floodOpacity="0.7" />
        </filter>
        <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.bg0} stopOpacity="0" />
          <stop offset="0.45" stopColor={p.bg0} stopOpacity="0.85" />
          <stop offset="1" stopColor={p.bg0} stopOpacity="1" />
        </linearGradient>
      </defs>

      <g clipPath={`url(#${id}-clip)`}>
        <NoirBackdrop p={p} id={id} width={W} height={H} />

        <g transform="translate(150 172)" opacity={0.07}>
          <TeamEmblem team={team} color={p.rim} size={112} />
        </g>

        {art && (
          <g filter={`url(#${id}-art)`}>
            <g transform={art.transform}>
              <art.Art p={p} />
            </g>
          </g>
        )}

        <rect y="250" width={W} height="150" fill={`url(#${id}-fade)`} />

        {/* Etiqueta da categoria */}
        <path d="M0,18 L112,18 L102,42 L0,42 Z" fill={p.accent} />
        <text
          x="14"
          y="35.5"
          fontSize="13"
          fontWeight={900}
          fill={p.bg0}
          fontFamily={MONO_FONT}
          letterSpacing="2"
        >
          {CATEGORY_LABEL[card.cardCategory]}
        </text>

        <g transform="translate(270 30)">
          <circle r="16" fill="#000000" opacity={0.45} />
          <TeamEmblem team={team} color={p.rim} size={10} />
        </g>

        {/* Nome */}
        <g transform="translate(20 324) skewX(-8)">
          <text
            fontSize={titleSize}
            fontWeight={900}
            fill="#ffffff"
            fontFamily={TITLE_FONT}
            letterSpacing="0.5"
            stroke={p.bg0}
            strokeWidth={0.6}
          >
            {name}
          </text>
        </g>
        <path d="M20,334 L150,334" stroke={p.accent} strokeWidth={3} strokeLinecap="round" />
        <path d="M156,334 L172,334" stroke={p.accent} strokeWidth={3} strokeLinecap="round" opacity={0.5} />

        <StatChips card={card} p={p} />
      </g>

      {/* Moldura */}
      <rect
        x="1.5"
        y="1.5"
        width={W - 3}
        height={H - 3}
        rx="15"
        fill="none"
        stroke={p.rim}
        strokeOpacity={0.6}
        strokeWidth={3}
      />
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

/* ═══════════════════════════════════════════════
   CARD BACK — verso com personagem
   ═══════════════════════════════════════════════ */

export const NoirCardBack = ({ team, className }: { team: TeamName; className?: string }) => {
  const p = getPalette(team);
  const id = useSvgId("back");
  const Character = TEAM_CHARACTERS[team][1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label="Verso da carta">
      <defs>
        <clipPath id={`${id}-clip`}>
          <rect width={W} height={H} rx="16" />
        </clipPath>
        <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.55" stopColor={p.bg0} stopOpacity="0" />
          <stop offset="1" stopColor={p.bg0} stopOpacity="0.95" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        <NoirBackdrop p={p} id={id} width={W} height={H} />
        <g transform="translate(150 200)" opacity={0.1}>
          <TeamEmblem team={team} color={p.rim} size={130} />
        </g>
        <g transform="translate(-34 -36) scale(0.92)">
          <Character p={p} />
        </g>
        <rect width={W} height={H} fill={`url(#${id}-fade)`} />
        <text
          x={W / 2}
          y="360"
          textAnchor="middle"
          fontSize="26"
          fontWeight={900}
          fill="#ffffff"
          fontFamily={TITLE_FONT}
          letterSpacing="6"
        >
          CARD STRIKE
        </text>
        <path d={`M100,374 H200`} stroke={p.accent} strokeWidth={3} strokeLinecap="round" />
      </g>
      <rect
        x="1.5"
        y="1.5"
        width={W - 3}
        height={H - 3}
        rx="15"
        fill="none"
        stroke={p.rim}
        strokeOpacity={0.6}
        strokeWidth={3}
      />
    </svg>
  );
};
