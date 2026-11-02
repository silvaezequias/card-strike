"use client";

import { CSSProperties, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  Bomb,
  Bot,
  Check,
  Clock,
  Crosshair,
  Info,
  Lock,
  Play,
  Shield,
  Shuffle,
} from "lucide-react";
import { factionPalette, policePalette } from "@/components/art/palette";
import { MapBoard } from "@/components/game/map-board";
import { SetupSettings, TeamName } from "@/game/game-types";
import { BOT_NAME, GameMode, useGameSetup } from "@/game/useSetupGame";
import { OnlinePlay } from "@/components/online/online-play";

/* ═══════════════════════════════════════════════
   ABA JOGAR
   Como a tela de partida dos jogos de tiro tático:
   subabas no topo (tipo de partida), opções e times
   na coluna da esquerda, os modos de jogo em cartões
   altos no centro e o botão de jogar embaixo.
   Por enquanto existe um modo só: Bombsite.
   ═══════════════════════════════════════════════ */

const PLAYER_MODES: { id: GameMode | "online"; label: string }[] = [
  { id: "solo", label: "1 jogador" },
  { id: "local", label: "Local" },
  { id: "online", label: "Online" },
];

const TEAM_STYLE: Record<
  TeamName,
  { label: string; color: string; Icon: typeof Shield }
> = {
  police: { label: "Polícia", color: policePalette.rim, Icon: Shield },
  faction: { label: "Facção", color: factionPalette.rim, Icon: Crosshair },
};

const ACCENT = "#c9bcff";
const GO = "#2fd36a";

const SubTab = ({
  label,
  active,
  disabled,
  note,
  onClick,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  note?: string;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`rounded-sm px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest transition-colors ${
      active
        ? "text-[#07060c]"
        : disabled
          ? "cursor-not-allowed text-zinc-600"
          : "text-zinc-300 hover:text-white"
    }`}
    style={active ? { background: ACCENT } : undefined}
  >
    {label}
    {note && <span className="ml-1 text-[9px] text-zinc-600">{note}</span>}
  </button>
);

/** Escolha de time de um jogador: dois botões, um por time. */
const TeamPicker = ({
  team,
  disabled,
  onPick,
}: {
  team: TeamName | null;
  disabled?: boolean;
  onPick: (team: TeamName) => void;
}) => (
  <div className="flex gap-1">
    {(["police", "faction"] as TeamName[]).map((t) => {
      const { label, color, Icon } = TEAM_STYLE[t];
      const selected = team === t;
      return (
        <button
          key={t}
          type="button"
          disabled={disabled}
          onClick={() => onPick(t)}
          className="flex flex-1 items-center justify-center gap-1 rounded-sm border px-2 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-40"
          style={{
            borderColor: selected ? color : "rgba(255,255,255,0.12)",
            color: selected ? color : "#a1a1aa",
            background: selected ? `${color}22` : "transparent",
          }}
        >
          <Icon size={11} />
          {label}
        </button>
      );
    })}
  </div>
);

/** Cartão alto de um modo de jogo, com a arte do mapa e o emblema. */
const ModeCard = ({
  selected,
  onSelect,
}: {
  selected: boolean;
  onSelect: () => void;
}) => (
  <button
    type="button"
    onClick={onSelect}
    aria-pressed={selected}
    className="group relative h-full w-full max-w-[15rem] overflow-hidden border-[3px] bg-[#0b0916] text-left transition-transform hover:-translate-y-1"
    style={{ borderColor: selected ? "#ffffff" : "rgba(255,255,255,0.25)" }}
  >
    {/* Mapa tático deitado como foto de fundo */}
    <div className="pointer-events-none absolute left-1/2 top-1/2 w-[260%] -translate-x-1/2 -translate-y-1/2 rotate-90 opacity-80 transition-transform duration-500 group-hover:scale-105">
      <MapBoard
        positions={{ police: "BASE", faction: "BASE" }}
        flat
        className="w-full"
      />
    </div>
    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/85" />

    <span className="absolute left-2 top-2 rounded-sm bg-[#c9bcff] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#07060c]">
      Novo
    </span>
    <span
      className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center border-2"
      style={{
        borderColor: "#ffffff",
        background: selected ? "#ffffff" : "transparent",
      }}
    >
      {selected && <Check size={13} className="text-black" strokeWidth={4} />}
    </span>

    {/* Emblema */}
    <span
      className="absolute left-1/2 top-[44%] flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
      style={{
        borderColor: "#ffffff",
        background: `conic-gradient(${policePalette.bg2} 0 50%, ${factionPalette.bg2} 50% 100%)`,
      }}
    >
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#07060c] ring-2 ring-[#ffb020]">
        <Bomb size={40} className="text-[#ffb020]" />
      </span>
    </span>

    <span className="absolute inset-x-0 bottom-3 flex flex-col items-center text-center">
      <span className="text-xl font-black tracking-wider text-white drop-shadow">
        Bombsite
      </span>
      <span className="text-[10px] uppercase tracking-widest text-zinc-300">
        Polícia x Facção
      </span>
      <span className="mt-1 flex items-center gap-1 text-[10px] text-zinc-400">
        <Clock size={10} /> Rodadas de 60 s
      </span>
    </span>
  </button>
);

/** Espaço de um modo que ainda não existe. */
const SoonCard = () => (
  <div className="flex h-full w-full max-w-[15rem] flex-col items-center justify-center gap-2 border-[3px] border-dashed border-white/10 bg-black/25 text-zinc-600">
    <Lock size={22} />
    <span className="text-[10px] font-bold uppercase tracking-[0.3em]">
      Em breve
    </span>
  </div>
);

/** Aba JOGAR do menu: tipo de partida, times, modo e início. */
export const PlayLobby = ({
  lobby,
  onStart,
  initialOnline = false,
}: {
  lobby: ReturnType<typeof useGameSetup>;
  onStart: (setup: SetupSettings) => void;
  initialOnline?: boolean;
}) => {
  const [online, setOnline] = useState(initialOnline);
  const { mode, seats, botTeam, isShuffling, namesFilled, canStart } = lobby;
  const active = seats.filter((_, i) => mode === "local" || i === 0);
  const bench = active.filter(({ player }) => !player.team);

  const hint = !namesFilled
    ? mode === "solo"
      ? "Digite o seu nome"
      : "Digite o nome dos dois jogadores"
    : bench.length > 0
      ? mode === "solo"
        ? "Escolha o seu time"
        : "Coloque um jogador em cada time"
      : "Tudo pronto";

  const handleStart = () => {
    const setup = lobby.buildSetup();
    if (setup) onStart(setup);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Subabas */}
      <div className="flex flex-col items-center gap-1 border-b border-white/10 bg-black/40 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-1">
          <SubTab label="Partida" active />
          <Link
            href="/tutorial"
            className="rounded-sm px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:text-white"
          >
            Treino (tutorial)
          </Link>
        </div>
        <div className="flex items-center gap-1">
          {PLAYER_MODES.map(({ id, label }, i) => (
            <span key={id} className="flex items-center gap-1">
              {i > 0 && <span className="h-3 w-px bg-white/15" />}
              <SubTab
                label={label}
                active={online ? id === "online" : id === mode}
                onClick={() => {
                  setOnline(id === "online");
                  if (id !== "online") lobby.setMode(id);
                }}
              />
            </span>
          ))}
        </div>
      </div>

      {online ? (
        <OnlinePlay />
      ) : (
        <>
          <div className="flex min-h-0 flex-1 gap-6 px-6 py-5">
            {/* Opções e times */}
            <aside className="flex w-64 shrink-0 flex-col gap-4 overflow-y-auto">
              <p
                className="flex items-center gap-2 text-sm font-black uppercase italic tracking-wider"
                style={{ color: GO }}
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ background: GO, boxShadow: `0 0 10px ${GO}` }}
                />
                {mode === "solo" ? "Contra o BOT" : "Mesmo computador"}
              </p>

              <section className="flex flex-col gap-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-300">
                  Jogadores
                </h3>
                {active.map(({ player, index }) => (
                  <div key={index} className="flex flex-col gap-1.5">
                    <input
                      type="text"
                      value={player.name}
                      onChange={(e) =>
                        lobby.setPlayerName(index, e.target.value)
                      }
                      placeholder={`Jogador ${index + 1}`}
                      maxLength={16}
                      aria-label={`Nome do jogador ${index + 1}`}
                      className="rounded-sm border border-white/15 bg-black/50 px-2.5 py-1.5 text-sm tracking-wider text-white placeholder-zinc-500 focus:border-white/50 focus:outline-none"
                    />
                    <TeamPicker
                      team={player.team}
                      disabled={isShuffling}
                      onPick={(team) => lobby.movePlayer(index, team)}
                    />
                  </div>
                ))}
                {botTeam && (
                  <div className="flex items-center gap-2 rounded-sm border border-white/10 bg-black/40 px-2.5 py-1.5 text-sm">
                    <Bot
                      size={15}
                      style={{ color: TEAM_STYLE[botTeam].color }}
                    />
                    <span className="font-bold text-white">{BOT_NAME}</span>
                    <span
                      className="ml-auto text-[10px] uppercase tracking-widest"
                      style={{ color: TEAM_STYLE[botTeam].color }}
                    >
                      {TEAM_STYLE[botTeam].label}
                    </span>
                  </div>
                )}
              </section>

              <section className="flex flex-col gap-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-300">
                  Times
                </h3>
                <button
                  onClick={lobby.shuffleTeams}
                  disabled={isShuffling}
                  className="flex items-center gap-2 text-left text-xs font-bold text-zinc-200 transition-colors hover:text-white disabled:opacity-50"
                >
                  <Shuffle
                    size={14}
                    className={isShuffling ? "animate-spin" : ""}
                  />
                  {isShuffling ? "Sorteando..." : "Aleatorizar"}
                </button>
                <button
                  onClick={lobby.swapTeams}
                  disabled={isShuffling || bench.length === active.length}
                  className="flex items-center gap-2 text-left text-xs font-bold text-zinc-200 transition-colors hover:text-white disabled:opacity-40"
                >
                  <ArrowLeftRight size={14} />
                  Trocar de lado
                </button>
              </section>

              <p className="mt-auto flex items-start gap-2 rounded-sm bg-black/50 p-2.5 text-[11px] text-zinc-300">
                <Info size={14} className="mt-0.5 shrink-0" />
                {mode === "solo"
                  ? "O BOT joga sozinho no outro time. Bom para treinar as cartas."
                  : "Os dois jogadores revezam no mesmo computador, um turno cada."}
              </p>
            </aside>

            {/* Modos de jogo */}
            <div className="flex min-w-0 flex-1 items-stretch gap-3 overflow-x-auto pb-1">
              <ModeCard selected onSelect={() => undefined} />
              <SoonCard />
              <SoonCard />
              <SoonCard />
            </div>
          </div>

          {/* Rodapé com o botão de jogar */}
          <footer className="flex items-center justify-end gap-4 border-t border-white/10 bg-black/40 px-6 py-3 backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-widest text-zinc-400">
              {hint}
            </p>
            <button
              onClick={handleStart}
              disabled={!canStart}
              className="flex items-center gap-3 px-12 py-3 text-xl font-black uppercase tracking-[0.3em] text-white transition-[filter,opacity] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
              style={
                {
                  background: `linear-gradient(180deg, ${GO}, #13853c)`,
                  boxShadow: canStart
                    ? `0 0 24px ${GO}88, inset 0 0 0 2px #7dffab`
                    : undefined,
                } as CSSProperties
              }
            >
              <Play size={20} fill="white" />
              Jogar
            </button>
          </footer>
        </>
      )}
    </div>
  );
};
