"use client";

import { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  BookOpen,
  Bot,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Globe,
  GraduationCap,
  Play,
  Shield,
  Shuffle,
  User,
  Users,
  X,
} from "lucide-react";
import { Portrait } from "@/components/art/noir";
import { SetupSettings, TeamName } from "@/game/game-types";
import { BOT_NAME, GameMode, LobbyPlayer, useGameSetup } from "@/game/useSetupGame";

const MODES: { id: GameMode | "online"; label: string; icon: typeof User }[] = [
  { id: "solo", label: "1 jogador", icon: User },
  { id: "local", label: "Local", icon: Users },
  { id: "online", label: "Online", icon: Globe },
];

const TEAM_STYLE = {
  police: {
    label: "Polícia",
    icon: Shield,
    joinArrow: ChevronLeft,
    text: "text-blue-400",
    frame: "border-blue-500/40 from-blue-950/50",
    join: "border-blue-500/60 text-blue-300 hover:bg-blue-500/20",
  },
  faction: {
    label: "Facção",
    icon: Crosshair,
    joinArrow: ChevronRight,
    text: "text-red-400",
    frame: "border-red-500/40 from-red-950/50",
    join: "border-red-500/60 text-red-300 hover:bg-red-500/20",
  },
};

const PlayerRow = ({
  index,
  player,
  onName,
  children,
}: {
  index: number;
  player: LobbyPlayer;
  onName: (name: string) => void;
  children?: ReactNode;
}) => (
  <div>
    <label
      htmlFor={`player-${index}`}
      className="mb-1 block text-[10px] uppercase tracking-[0.2em] text-zinc-400"
    >
      Jogador {index + 1}
    </label>
    <div className="flex items-center gap-2">
      <input
        id={`player-${index}`}
        type="text"
        value={player.name}
        onChange={(e) => onName(e.target.value)}
        placeholder="Seu nome..."
        maxLength={16}
        className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/60 px-3 py-2 text-sm tracking-wider text-white placeholder-zinc-500 transition-colors focus:border-white/50 focus:outline-none"
      />
      {children}
    </div>
  </div>
);

export const GameMenu = ({
  onStart,
}: {
  onStart: (setup: SetupSettings) => void;
}) => {
  const lobby = useGameSetup();
  const { mode, seats, botTeam, isShuffling, namesFilled, canStart } = lobby;

  const handleStart = () => {
    const setup = lobby.buildSetup();
    if (setup) onStart(setup);
  };

  const bench = seats.filter(({ player }) => !player.team);

  const hint = !namesFilled
    ? mode === "solo"
      ? "Digite o seu nome"
      : "Digite o nome dos dois jogadores"
    : bench.length > 0
      ? mode === "solo"
        ? "Escolha o seu time"
        : "Coloque um jogador em cada time"
      : "Times prontos";

  const teamSide = (team: TeamName) => {
    const style = TEAM_STYLE[team];
    const { icon: Icon, joinArrow: JoinArrow } = style;
    const seat = seats.find(({ player }) => player.team === team);
    const isBot = team === botTeam;

    return (
      <section
        aria-label={`Time ${style.label}`}
        className={`relative flex min-h-[26rem] flex-col justify-between overflow-hidden rounded-2xl border bg-gradient-to-b to-transparent p-4 ${style.frame}`}
      >
        <Portrait
          team={team}
          flip={team === "police"}
          backdrop={false}
          className={`pointer-events-none absolute -bottom-4 left-1/2 h-[85%] w-auto max-w-none -translate-x-1/2 transition-opacity duration-300 ${
            seat || isBot ? "opacity-90" : "opacity-25"
          }`}
        />

        <div className={`relative flex items-center gap-2 ${style.text}`}>
          <Icon size={20} />
          <h2 className="text-xl font-black uppercase tracking-[0.2em]">{style.label}</h2>
        </div>

        <div className="relative rounded-xl bg-black/70 p-3 backdrop-blur-sm">
          {isBot ? (
            <p className="flex items-center gap-2 py-1 text-sm font-bold tracking-widest text-white">
              <Bot size={18} className={style.text} />
              {BOT_NAME}
            </p>
          ) : seat ? (
            <PlayerRow
              index={seat.index}
              player={seat.player}
              onName={(name) => lobby.setPlayerName(seat.index, name)}
            >
              <button
                aria-label="Tirar do time"
                title="Tirar do time"
                onClick={() => lobby.movePlayer(seat.index, null)}
                disabled={isShuffling}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-white/15 bg-black/50 text-zinc-300 transition-colors hover:border-white/40 hover:text-white disabled:opacity-40"
              >
                <X size={16} />
              </button>
            </PlayerRow>
          ) : (
            <div className="space-y-2">
              {bench.map(({ player: waiting, index: i }) => (
                <button
                  key={i}
                  onClick={() => lobby.movePlayer(i, team)}
                  className={`flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${style.join}`}
                >
                  <JoinArrow size={14} />
                  {waiting.name.trim() || `Jogador ${i + 1}`} entra
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  };

  return (
    <div className="relative flex min-h-screen select-none flex-col gap-4 overflow-x-hidden bg-[#050409] px-4 py-5 font-mono md:px-8">
      <header className="text-center">
        <h1 className="text-3xl font-black tracking-[0.3em] text-white">CARD STRIKE</h1>
        <p className="text-xs uppercase tracking-[0.4em] text-zinc-400">Operação tática</p>
      </header>

      <nav aria-label="Modo de jogo" className="mx-auto flex overflow-hidden rounded-lg border border-white/15">
        {MODES.map(({ id, label, icon: Icon }) => {
          const available = id !== "online";
          const selected = id === mode;
          return (
            <button
              key={id}
              disabled={!available}
              aria-pressed={selected}
              onClick={() => id !== "online" && lobby.setMode(id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors ${
                selected
                  ? "bg-white text-black"
                  : available
                    ? "text-zinc-300 hover:bg-white/10 hover:text-white"
                    : "cursor-not-allowed text-zinc-500"
              }`}
            >
              <Icon size={14} />
              {label}
              {!available && <span className="text-[9px] tracking-wider text-zinc-600">Em breve</span>}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-4 md:grid-cols-[1fr_15rem_1fr]">
        {teamSide("police")}

        <div className="flex flex-col justify-center gap-3">
          {bench.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-center text-[10px] uppercase tracking-[0.3em] text-zinc-400">Sem time</h2>
              {bench.map(({ player, index }) => (
                <PlayerRow
                  key={index}
                  index={index}
                  player={player}
                  onName={(name) => lobby.setPlayerName(index, name)}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-5xl font-black tracking-widest text-white/80">VS</p>
          )}

          <button
            onClick={lobby.shuffleTeams}
            disabled={isShuffling}
            className="flex items-center justify-center gap-2 rounded-lg border border-white/20 px-3 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-200 transition-colors hover:border-white/50 hover:text-white disabled:opacity-50"
          >
            <Shuffle size={15} className={isShuffling ? "animate-spin" : ""} />
            {isShuffling ? "Sorteando..." : "Aleatorizar"}
          </button>

          <button
            onClick={lobby.swapTeams}
            disabled={isShuffling || bench.length === seats.length}
            className="flex items-center justify-center gap-2 rounded-lg border border-white/20 px-3 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-200 transition-colors hover:border-white/50 hover:text-white disabled:opacity-40"
          >
            <ArrowLeftRight size={15} />
            Trocar de lado
          </button>
        </div>

        {teamSide("faction")}
      </main>

      <footer className="mx-auto flex w-full max-w-md flex-col items-center gap-2">
        <p className="text-[11px] uppercase tracking-widest text-zinc-400">{hint}</p>
        <button
          onClick={handleStart}
          disabled={!canStart}
          className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-6 py-3.5 text-sm font-bold uppercase tracking-[0.2em] text-black transition-all hover:bg-zinc-200 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-zinc-500"
        >
          <Play size={18} />
          Iniciar partida
        </button>
        <div className="flex gap-6">
          <Link
            href="/tutorial"
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:text-white"
          >
            <GraduationCap size={14} />
            Tutorial
          </Link>
          <Link
            href="/cartas"
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 transition-colors hover:text-white"
          >
            <BookOpen size={14} />
            Cartas e regras
          </Link>
        </div>
      </footer>
    </div>
  );
};
