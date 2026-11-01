"use client";

import { CSSProperties } from "react";
import { ITEM_ART } from "@/components/art/items";
import { getPalette } from "@/components/art/palette";
import {
  BOMB_FX_MS,
  BULLET_GAP_MS,
  BULLET_TRAVEL_MS,
  THROW_MS,
  fxKind,
} from "@/game/card-fx";
import { CombatEvent } from "@/game/game-types";

/* ═══════════════════════════════════════════════
   EFEITOS VISUAIS DAS CARTAS
   CombatFx anima a jogada sobre o mapa (coordenadas
   do próprio mapa). Flames e SmokeCloud ficam presos
   ao peão enquanto o efeito durar. FlashBlind e
   BombExplosion cobrem a tela inteira.
   ═══════════════════════════════════════════════ */

type Point = { x: number; y: number };

const fxStyle = (delay: number, vars: Record<string, string | number> = {}) =>
  ({ animationDelay: `${delay}ms`, ...vars }) as CSSProperties;

const TITLE_FONT = "'Arial Black', Impact, 'Helvetica Neue', sans-serif";

const GUN_SCALE = 0.36;
const GUN_OFFSET = 56;
const MUZZLE_OFFSET = 112;
const BODY_RADIUS = 30;

/** Arte do item, centrada na origem e sem a inclinação usada na carta. */
const ItemSprite = ({ event, scale }: { event: CombatEvent; scale: number }) => {
  const item = ITEM_ART[event.card.name];
  return (
    <g transform={`scale(${scale}) rotate(${-item.tilt}) translate(-150 -172)`}>
      <g transform={item.transform}>
        <item.Art p={getPalette(event.team)} />
      </g>
    </g>
  );
};

/** Atirador com a arma da carta: uma bala por ponto de dano. */
const Shots = ({ event, from, to }: { event: CombatEvent; from: Point; to: Point }) => {
  const dir = Math.sign(to.x - from.x) || 1;
  const count = event.card.damage;
  const muzzle = from.x + dir * MUZZLE_OFFSET;
  // Com Smoke as balas somem na fumaça, antes de chegar ao corpo.
  const stop = to.x - dir * (event.blocked ? BODY_RADIUS * 2 : BODY_RADIUS);
  const p = getPalette(event.team);

  return (
    <g>
      <g
        transform={`translate(${from.x + dir * GUN_OFFSET} ${from.y + 8}) scale(${dir} 1)`}
        style={{ filter: `drop-shadow(0 0 3px ${p.rim}) drop-shadow(0 0 7px ${p.glow})` }}
      >
        <g
          className="fx-recoil"
          style={{ animationDuration: `${BULLET_GAP_MS}ms`, animationIterationCount: count }}
        >
          <ItemSprite event={event} scale={GUN_SCALE} />
        </g>
      </g>

      {Array.from({ length: count }).map((_, i) => {
        const delay = i * BULLET_GAP_MS;
        const spread = ((i * 7) % 5) * 5 - 10;
        return (
          <g key={i}>
            <circle cx={muzzle} cy={from.y + 2} r="13" fill="#ffd97a" className="fx-pop" style={fxStyle(delay)} />
            <g
              className="fx-bullet"
              style={fxStyle(delay, {
                animationDuration: `${BULLET_TRAVEL_MS}ms`,
                "--fx-dx": `${stop - muzzle}px`,
              })}
            >
              <rect x={muzzle - 13} y={from.y + spread / 4} width="26" height="3.5" rx="1.75" fill={p.rim} />
              <rect x={muzzle + 7} y={from.y + spread / 4} width="9" height="3.5" rx="1.75" fill="#ffffff" />
            </g>
            {!event.blocked && (
              <>
                <circle
                  cx={stop}
                  cy={to.y + spread}
                  r="15"
                  fill="#ff2a2a"
                  className="fx-pop"
                  style={fxStyle(delay + BULLET_TRAVEL_MS)}
                />
                <text
                  x={to.x + spread * 2}
                  y={to.y - 46}
                  textAnchor="middle"
                  fontSize="26"
                  fontWeight={900}
                  fill="#ff4d4d"
                  stroke="#000000"
                  strokeWidth={4}
                  paintOrder="stroke"
                  fontFamily={TITLE_FONT}
                  className="fx-float"
                  style={fxStyle(delay + BULLET_TRAVEL_MS)}
                >
                  -1
                </text>
              </>
            )}
          </g>
        );
      })}
    </g>
  );
};

/** Item arremessado em arco de um jogador ao outro. */
const Throw = ({ event, from, to }: { event: CombatEvent; from: Point; to: Point }) => (
  <g transform={`translate(${from.x} ${from.y})`}>
    <g
      className="fx-throw-x"
      style={{ animationDuration: `${THROW_MS}ms`, "--fx-dx": `${to.x - from.x}px` } as CSSProperties}
    >
      <g className="fx-throw-y" style={{ animationDuration: `${THROW_MS}ms` }}>
        <g className="fx-spin">
          <ItemSprite event={event} scale={0.14} />
        </g>
      </g>
    </g>
  </g>
);

const SPARKS = Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2);

const Blast = ({ at, delay, radius, smoke }: { at: Point; delay: number; radius: number; smoke: number }) => (
  <g>
    {Array.from({ length: smoke }).map((_, i) => {
      const angle = (i / smoke) * Math.PI * 2;
      return (
        <circle
          key={i}
          cx={at.x + Math.cos(angle) * radius * 0.55}
          cy={at.y + Math.sin(angle) * radius * 0.4}
          r={radius * 0.5}
          fill="url(#fx-smoke)"
          className="fx-puff"
          style={fxStyle(delay + 120)}
        />
      );
    })}
    <circle cx={at.x} cy={at.y} r={radius} fill="url(#fx-blast)" className="fx-pop-big" style={fxStyle(delay)} />
    <circle
      cx={at.x}
      cy={at.y}
      r={radius * 0.8}
      fill="none"
      stroke="#ffe2a8"
      strokeWidth="5"
      className="fx-ring"
      style={fxStyle(delay)}
    />
    {SPARKS.map((angle) => (
      <path
        key={angle}
        d={`M${at.x + Math.cos(angle) * radius * 0.4},${at.y + Math.sin(angle) * radius * 0.4} L${at.x + Math.cos(angle) * radius},${at.y + Math.sin(angle) * radius}`}
        stroke="#ffd97a"
        strokeWidth="4"
        strokeLinecap="round"
        className="fx-pop"
        style={fxStyle(delay)}
      />
    ))}
  </g>
);

/** Jogada animada sobre o mapa. Monta quando a ação começa. */
export const CombatFx = ({
  event,
  from,
  to,
  width,
  height,
}: {
  event: CombatEvent;
  from: Point;
  to: Point;
  width: number;
  height: number;
}) => {
  const kind = fxKind(event.card);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="fx-blast">
          <stop offset="0" stopColor="#fff7d6" />
          <stop offset="0.35" stopColor="#ffb340" />
          <stop offset="0.7" stopColor="#f0480f" stopOpacity="0.85" />
          <stop offset="1" stopColor="#7a1400" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="fx-smoke">
          <stop offset="0" stopColor="#a8acb8" stopOpacity="0.8" />
          <stop offset="1" stopColor="#5a5d68" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="fx-flash">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#fff9dc" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {kind === "shots" && <Shots event={event} from={from} to={to} />}

      {kind === "grenade" && (
        <>
          <Throw event={event} from={from} to={to} />
          <Blast at={to} delay={THROW_MS} radius={110} smoke={6} />
        </>
      )}

      {kind === "molotov" && (
        <>
          <Throw event={event} from={from} to={to} />
          <Blast at={to} delay={THROW_MS} radius={60} smoke={0} />
        </>
      )}

      {kind === "flashbang" && (
        <>
          <Throw event={event} from={from} to={to} />
          <circle cx={to.x} cy={to.y} r="170" fill="url(#fx-flash)" className="fx-pop-big" style={fxStyle(THROW_MS)} />
        </>
      )}

      {kind === "smoke" && (
        <g>
          {[0, 1, 2, 3].map((i) => (
            <circle
              key={i}
              cx={from.x + (i - 1.5) * 26}
              cy={from.y + (i % 2) * 14}
              r="52"
              fill="url(#fx-smoke)"
              className="fx-puff"
              style={fxStyle(i * 90)}
            />
          ))}
        </g>
      )}
    </svg>
  );
};

/* ───────────── EFEITOS PRESOS AO PEÃO ───────────── */

const FLAMES = [
  { x: 14, s: 0.75, d: 0 },
  { x: 86, s: 0.75, d: 180 },
  { x: 32, s: 1.05, d: 90 },
  { x: 68, s: 1.05, d: 260 },
  { x: 50, s: 1.3, d: 140 },
];

const FLAME_PATH = "M0,0 C-13,-9 -12,-24 -3,-40 C-2,-28 5,-25 6,-35 C15,-21 14,-7 0,0 Z";

/** Fogo da Molotov embaixo do jogador; fica atrás do peão. */
export const Flames = () => (
  <svg
    viewBox="0 0 100 100"
    className="pointer-events-none absolute -left-[45%] -top-[42%] h-[190%] w-[190%] overflow-visible"
    aria-hidden="true"
  >
    <ellipse cx="50" cy="82" rx="46" ry="15" fill="#ff5a14" opacity="0.45" className="fx-flame-glow" />
    {FLAMES.map((flame) => (
      <g key={flame.x} transform={`translate(${flame.x} 90) scale(${flame.s})`}>
        <g className="fx-flame" style={fxStyle(flame.d)}>
          <path d={FLAME_PATH} fill="#ff4a0f" />
          <path d={FLAME_PATH} fill="#ffb01f" transform="scale(0.62)" />
          <path d={FLAME_PATH} fill="#fff1b0" transform="scale(0.3)" />
        </g>
      </g>
    ))}
  </svg>
);

const SMOKE_PUFFS = [
  { x: 50, y: 50, s: 62, d: 0 },
  { x: 24, y: 38, s: 46, d: 400 },
  { x: 76, y: 36, s: 46, d: 900 },
  { x: 22, y: 68, s: 44, d: 1400 },
  { x: 78, y: 66, s: 46, d: 600 },
  { x: 50, y: 22, s: 44, d: 1100 },
  { x: 50, y: 80, s: 46, d: 200 },
];

/** Smoke por cima do jogador. */
export const SmokeCloud = () => (
  <div
    className="fx-smoke-in pointer-events-none absolute -left-[75%] -top-[75%] h-[250%] w-[250%]"
    aria-hidden="true"
  >
    {SMOKE_PUFFS.map((puff) => (
      <div
        key={`${puff.x}-${puff.y}`}
        className="fx-smoke-drift absolute rounded-full"
        style={{
          left: `${puff.x - puff.s / 2}%`,
          top: `${puff.y - puff.s / 2}%`,
          width: `${puff.s}%`,
          height: `${puff.s}%`,
          background: "radial-gradient(circle, rgba(196,200,212,0.92) 0%, rgba(150,154,168,0.7) 45%, rgba(120,124,138,0) 72%)",
          animationDelay: `${-puff.d}ms`,
        }}
      />
    ))}
  </div>
);

/* ───────────── TELA INTEIRA ───────────── */

/** Clarão da Flashbang: tela branca enquanto o jogador perde a vez. */
export const FlashBlind = () => (
  <div className="fx-blind pointer-events-none fixed inset-0 z-[85] flex flex-col items-center justify-center gap-2 bg-white">
    <p className="text-3xl font-black tracking-[0.3em] text-zinc-800">CEGO PELA FLASHBANG</p>
    <p className="text-sm font-bold tracking-widest text-zinc-500">VOCÊ PERDEU A VEZ</p>
  </div>
);

const BOMB_SMOKE = Array.from({ length: 34 }, (_, i) => {
  const angle = i * 2.399963; // ângulo áureo: espalha sem sortear
  const distance = 18 + ((i * 37) % 60);
  return {
    x: Math.round(Math.cos(angle) * distance * 100) / 100,
    y: Math.round(Math.sin(angle) * distance * 100) / 100,
    size: 26 + ((i * 13) % 26),
    delay: 120 + ((i * 53) % 700),
  };
});

/**
 * Explosão da C4. O tremor e a distorção ficam na tela do jogo
 * (classe bomb-shock), que usa o filtro definido aqui.
 */
export const BombExplosion = () => (
  <div
    className="pointer-events-none fixed inset-0 z-[90] overflow-hidden"
    style={{ "--bomb-ms": `${BOMB_FX_MS}ms` } as CSSProperties}
  >
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <filter id="bomb-distort" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="2" seed="4" />
        <feDisplacementMap in="SourceGraphic" scale="0">
          <animate attributeName="scale" dur={`${BOMB_FX_MS}ms`} values="0;110;70;30;0" keyTimes="0;0.08;0.3;0.7;1" fill="freeze" />
        </feDisplacementMap>
      </filter>
    </svg>

    <div className="fx-bomb-ball absolute left-1/2 top-1/2 h-[140vmax] w-[140vmax] -translate-x-1/2 -translate-y-1/2 rounded-full" />
    <div className="fx-bomb-wave absolute left-1/2 top-1/2 h-[60vmax] w-[60vmax] rounded-full border-[1.2vmax] border-amber-100" />

    {BOMB_SMOKE.map((puff) => (
      <div
        key={puff.delay + puff.size}
        className="fx-bomb-smoke absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: `${puff.size}vmax`,
          height: `${puff.size}vmax`,
          marginLeft: `${-puff.size / 2}vmax`,
          marginTop: `${-puff.size / 2}vmax`,
          animationDelay: `${puff.delay}ms`,
          "--fx-x": `${puff.x}vmax`,
          "--fx-y": `${puff.y}vmax`,
        } as CSSProperties}
      />
    ))}

    <div className="fx-bomb-flash absolute inset-0 bg-white" />
  </div>
);
