"use client";

import { CSSProperties, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Bot, Crosshair, Play, Shield, Shuffle } from "lucide-react";
import { factionPalette, policePalette } from "@/components/art/palette";
import {
  CharacterImage,
  TEAM_CHARACTERS,
  characterCrop,
} from "@/components/art/characters";
import { SetupSettings, TeamName } from "@/game/game-types";
import { BOT_NAME, useGameSetup } from "@/game/useSetupGame";

/* ═══════════════════════════════════════════════
   ESCOLHA DE TIME
   Como a seleção de lado dos jogos de tiro tático:
   a tela dividida ao meio, Facção à esquerda e
   Polícia à direita, cada uma com o seu operador.
   Clique num lado para levar o jogador da vez para
   lá, ou aleatorize. Com todos posicionados, JOGAR.
   ═══════════════════════════════════════════════ */

const GO = "#2fd36a";

const SIDES: {
  team: TeamName;
  label: string;
  Icon: typeof Shield;
  color: string;
  glow: string;
  bg: string;
}[] = [
  {
    team: "faction",
    label: "Facção",
    Icon: Crosshair,
    color: factionPalette.rim,
    glow: factionPalette.glow,
    bg: `linear-gradient(160deg, ${factionPalette.bg2} 0%, ${factionPalette.bg1} 45%, ${factionPalette.bg0} 100%)`,
  },
  {
    team: "police",
    label: "Polícia",
    Icon: Shield,
    color: policePalette.rim,
    glow: policePalette.glow,
    bg: `linear-gradient(200deg, ${policePalette.bg2} 0%, ${policePalette.bg1} 45%, ${policePalette.bg0} 100%)`,
  },
];

type Occupant = { key: string; name: string; seat: number | null };

/** Operador de corpo inteiro; apagado quando o lado está vazio. */
const Operator = ({
  team,
  variant,
  ghost,
  offset,
}: {
  team: TeamName;
  variant: 0 | 1;
  ghost: boolean;
  offset: number;
}) => {
  const art = TEAM_CHARACTERS[team][variant];
  const box = characterCrop(art, "full");
  return (
    <svg
      viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
      className="h-full w-auto transition-[opacity,filter,transform] duration-500"
      style={{
        opacity: ghost ? 0.18 : 1,
        filter: ghost
          ? "grayscale(1) brightness(0.5)"
          : "drop-shadow(0 30px 40px rgba(0,0,0,0.7))",
        transform: `translateX(${offset}%)`,
      }}
      aria-hidden="true"
    >
      <CharacterImage art={art} />
    </svg>
  );
};

export const TeamSelect = ({
  lobby,
  onBack,
  onStart,
}: {
  lobby: ReturnType<typeof useGameSetup>;
  onBack: () => void;
  onStart: (setup: SetupSettings) => void;
}) => {
  const { mode, seats, botTeam, isShuffling, canStart } = lobby;
  // Jogador que escolhe agora: o primeiro sem time (ou o último clicado).
  const firstBench = seats.find(({ player }) => !player.team)?.index ?? null;
  const [picking, setPicking] = useState<number | null>(firstBench);
  useEffect(() => {
    if (picking === null || seats.every(({ index }) => index !== picking))
      setPicking(firstBench);
  }, [firstBench, picking, seats]);

  const occupants = (team: TeamName): Occupant[] => [
    ...seats
      .filter(({ player }) => player.team === team)
      .map(({ player, index }) => ({
        key: `p${index}`,
        name: player.name.trim() || `Jogador ${index + 1}`,
        seat: index,
      })),
    ...(botTeam === team ? [{ key: "bot", name: BOT_NAME, seat: null }] : []),
  ];

  const pick = (team: TeamName) => {
    if (isShuffling || picking === null) return;
    lobby.movePlayer(picking, team);
    // No local, o próximo a escolher é quem ainda está sem time.
    const next =
      seats.find(({ index, player }) => index !== picking && !player.team)
        ?.index ?? null;
    setPicking(next);
  };

  const start = () => {
    const setup = lobby.buildSetup();
    if (setup) onStart(setup);
  };

  const pickingName =
    picking !== null
      ? seats.find(({ index }) => index === picking)?.player.name.trim() ||
        `Jogador ${picking + 1}`
      : null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex select-none font-mono text-white animate-in fade-in duration-300">
      {SIDES.map(({ team, label, Icon, color, glow, bg }, sideIndex) => {
        const list = occupants(team);
        const hovered = picking !== null && !isShuffling;
        return (
          <button
            key={team}
            type="button"
            onClick={() => pick(team)}
            disabled={!hovered}
            aria-label={`Entrar na ${label}`}
            className="group relative flex h-full flex-1 flex-col items-center overflow-hidden outline-none"
            style={{ background: bg }}
          >
            {/* Luz do lado ao passar o mouse */}
            <span
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-disabled:opacity-0"
              style={{
                background: `radial-gradient(ellipse at 50% 70%, ${glow}33, transparent 65%)`,
              }}
            />
            {/* Cabeçalho do time */}
            <div className="relative z-10 mt-16 flex flex-col items-center gap-2">
              <span
                className="flex h-16 w-16 items-center justify-center rounded-full border-2 bg-black/40"
                style={{ borderColor: color, boxShadow: `0 0 24px ${glow}66` }}
              >
                <Icon size={30} style={{ color }} />
              </span>
              <h2
                className="text-4xl font-black uppercase tracking-[0.2em] drop-shadow-lg"
                style={{ textShadow: `0 0 20px ${glow}` }}
              >
                {label}
              </h2>
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-300">
                {list.filter((o) => o.seat !== null).length} jogador(es) ·{" "}
                {list.some((o) => o.seat === null) ? 1 : 0} bot
              </p>
            </div>

            {/* Operadores */}
            <div className="relative z-0 mt-auto flex h-[62%] items-end justify-center">
              {list.length === 0 ? (
                <Operator team={team} variant={0} ghost offset={0} />
              ) : (
                list.map((o, i) => (
                  <Operator
                    key={o.key}
                    team={team}
                    variant={(o.seat === null ? 0 : o.seat % 2) as 0 | 1}
                    ghost={false}
                    offset={list.length > 1 ? (i === 0 ? 18 : -18) : 0}
                  />
                ))
              )}
            </div>

            {/* Nomes */}
            <div className="absolute inset-x-0 bottom-24 z-10 flex justify-center gap-3">
              {list.map((o) => (
                <span
                  key={o.key}
                  className="flex items-center gap-1.5 rounded-sm border bg-black/70 px-3 py-1 text-sm font-black uppercase tracking-widest"
                  style={{ borderColor: color }}
                >
                  {o.seat === null && <Bot size={14} style={{ color }} />}
                  {o.name}
                </span>
              ))}
            </div>

            {/* Divisória central */}
            {sideIndex === 0 && (
              <span className="absolute right-0 top-0 h-full w-px bg-white/20" />
            )}
          </button>
        );
      })}

      {/* Centro: quem escolhe agora */}
      <div className="pointer-events-none absolute left-1/2 top-6 z-20 flex -translate-x-1/2 flex-col items-center gap-1">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/30 bg-black/60 text-sm font-black">
          VS
        </span>
        {pickingName && !isShuffling && (
          <p className="mt-1 rounded-sm bg-black/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-200">
            {mode === "solo"
              ? "Escolha o seu lado"
              : `${pickingName}: escolha o lado`}
          </p>
        )}
        {isShuffling && (
          <p className="mt-1 rounded-sm bg-black/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.25em]">
            Sorteando...
          </p>
        )}
      </div>

      {/* Jogadores (local): clique para trocar quem escolhe */}
      {mode === "local" && (
        <div className="absolute left-1/2 top-36 z-20 flex -translate-x-1/2 gap-2">
          {seats.map(({ player, index }) => (
            <button
              key={index}
              type="button"
              onClick={() => setPicking(index)}
              className="rounded-sm border px-3 py-1 text-[11px] font-bold uppercase tracking-widest transition-colors"
              style={
                picking === index
                  ? {
                      borderColor: "#fff",
                      background: "#ffffff",
                      color: "#07060c",
                    }
                  : {
                      borderColor: "#ffffff40",
                      background: "#00000099",
                      color: "#d4d4d8",
                    }
              }
            >
              {player.name.trim() || `Jogador ${index + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Rodapé: voltar, aleatorizar e jogar */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-4 bg-gradient-to-t from-black/90 to-transparent px-6 pb-5 pt-10">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-300 hover:text-white"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={lobby.shuffleTeams}
            disabled={isShuffling}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-200 hover:text-white disabled:opacity-50"
          >
            <Shuffle size={16} className={isShuffling ? "animate-spin" : ""} />{" "}
            Aleatorizar
          </button>
          <button
            type="button"
            onClick={start}
            disabled={!canStart}
            className="flex items-center gap-3 px-10 py-3 text-lg font-black uppercase tracking-[0.3em] text-white transition-[filter,opacity] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
            style={
              {
                background: `linear-gradient(180deg, ${GO}, #13853c)`,
                boxShadow: canStart
                  ? `0 0 24px ${GO}88, inset 0 0 0 2px #7dffab`
                  : undefined,
              } as CSSProperties
            }
          >
            <Play size={18} fill="white" /> Jogar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
