"use client";

import { useId } from "react";
import { TeamName } from "@/game/game-types";
import { ArtPalette, getPalette } from "./palette";
import { CharacterImage, TEAM_CHARACTERS, characterCrop } from "./characters";

/** Ids seguros para url(#id) — cada SVG precisa dos seus. */
export const useSvgId = (prefix: string) =>
  `${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

/* ═══════════════════════════════════════════════
   BACKDROP: gradiente escuro + faixas de luz
   diagonais desfocadas, como no pôster de referência.
   ═══════════════════════════════════════════════ */

export const NoirBackdrop = ({
  p,
  id,
  width,
  height,
}: {
  p: ArtPalette;
  id: string;
  width: number;
  height: number;
}) => (
  <g>
    <defs>
      <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0.35" y2="1">
        <stop offset="0" stopColor={p.bg1} />
        <stop offset="0.55" stopColor={p.bg0} />
        <stop offset="1" stopColor={p.bg0} />
      </linearGradient>
      <radialGradient id={`${id}-glow`} cx="0.62" cy="0.42" r="0.6">
        <stop offset="0" stopColor={p.bg2} stopOpacity="0.9" />
        <stop offset="1" stopColor={p.bg2} stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}-streak`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={p.streak} stopOpacity="0" />
        <stop offset="0.45" stopColor={p.streak} stopOpacity="0.9" />
        <stop offset="1" stopColor={p.streak} stopOpacity="0" />
      </linearGradient>
      <filter id={`${id}-blur`} x="-20%" y="-50%" width="140%" height="200%">
        <feGaussianBlur stdDeviation={width * 0.018} />
      </filter>
      <pattern
        id={`${id}-grain`}
        width="6"
        height="6"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(35)"
      >
        <rect width="6" height="1" fill="#ffffff" opacity="0.035" />
      </pattern>
    </defs>

    <rect width={width} height={height} fill={`url(#${id}-bg)`} />
    <rect width={width} height={height} fill={`url(#${id}-glow)`} />
    <g filter={`url(#${id}-blur)`} transform={`rotate(-16 ${width / 2} ${height / 2})`}>
      <rect
        x={-width * 0.2}
        y={height * 0.36}
        width={width * 1.4}
        height={height * 0.05}
        fill={`url(#${id}-streak)`}
        opacity="0.75"
      />
      <rect
        x={-width * 0.1}
        y={height * 0.46}
        width={width * 1.2}
        height={height * 0.012}
        fill={`url(#${id}-streak)`}
      />
      <rect
        x={-width * 0.3}
        y={height * 0.18}
        width={width * 1.2}
        height={height * 0.02}
        fill={`url(#${id}-streak)`}
        opacity="0.35"
      />
    </g>
    <rect width={width} height={height} fill={`url(#${id}-grain)`} />
  </g>
);

/* ═══════════════════════════════════════════════
   PORTRAIT
   ═══════════════════════════════════════════════ */

type Crop = "bust" | "head" | "card" | "full";

export const Portrait = ({
  team,
  variant = 0,
  crop = "bust",
  backdrop = true,
  className,
}: {
  team: TeamName;
  variant?: 0 | 1;
  crop?: Crop;
  backdrop?: boolean;
  /** Mantido por compatibilidade: as artes já olham para o centro da tela. */
  flip?: boolean;
  className?: string;
}) => {
  const p = getPalette(team);
  const id = useSvgId("portrait");
  const art = TEAM_CHARACTERS[team][variant];
  const box = characterCrop(art, crop);

  return (
    <svg
      viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
      className={className}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`Personagem ${team === "police" ? "da polícia" : "da facção"}`}
    >
      {backdrop && (
        <g transform={`translate(${box.x} ${box.y}) scale(${box.w / 400} ${box.h / 500})`}>
          <NoirBackdrop p={p} id={id} width={400} height={500} />
        </g>
      )}
      <CharacterImage art={art} />
    </svg>
  );
};
