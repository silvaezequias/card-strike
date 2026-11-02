"use client";

import { ReactNode, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Bot,
  Home,
  Layers,
  LogIn,
  History,
  Maximize2,
  Minimize2,
  Settings as SettingsIcon,
  UserRound,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Portrait } from "@/components/art/noir";
import { getPalette } from "@/components/art/palette";
import { Arena } from "@/components/game/menu-arena";
import { useFullscreen } from "@/components/settings/settings-panel";
import { SettingsView } from "@/components/settings/settings-view";
import { PlayLobby } from "@/components/game/game-menu";
import { InventoryView } from "@/components/game/inventory-view";
import { SetupSettings, TeamName } from "@/game/game-types";
import { useMusic } from "@/game/useGameSounds";
import { BOT_NAME, useGameSetup } from "@/game/useSetupGame";
import { updateSettings, useSettings } from "@/lib/settings";
import { useOnline } from "@/lib/online/online-context";
import { AccountPanel } from "@/components/online/account-panel";
import { FriendsPanel } from "@/components/online/friends-panel";
import { InviteToasts } from "@/components/online/invite-toasts";
import { Avatar, STATUS_COLOR, STATUS_LABEL } from "@/components/online/ui";

/* ═══════════════════════════════════════════════
   MENU PRINCIPAL
   No estilo dos jogos de tiro tático: barra no topo
   com as abas e o JOGAR no centro, ícones rápidos à
   esquerda, os jogadores na lateral direita e o
   operador em pé no meio da tela, sobre a arena.
   ═══════════════════════════════════════════════ */

type View = "home" | "play" | "inventory" | "history" | "settings";

const TEAM_LABEL: Record<TeamName, string> = {
  police: "Polícia",
  faction: "Facção",
};

const TopIcon = ({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
  >
    {children}
  </button>
);

const tabClass =
  "px-1.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] transition-colors lg:px-3 lg:text-sm lg:tracking-[0.15em]";

const NavTab = ({
  label,
  active,
  onClick,
  href,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  href?: string;
}) => {
  const className = `${tabClass} ${active ? "text-white" : "text-zinc-400 hover:text-white"}`;
  return href ? (
    <Link href={href} className={className}>
      {label}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {label}
    </button>
  );
};

const Divider = () => (
  <span className="h-4 w-px bg-white/20" aria-hidden="true" />
);

/** Operador em pé no centro, com a plaqueta do jogador à frente. */
const Hero = ({
  team,
  name,
  onPlay,
}: {
  team: TeamName;
  name: string;
  onPlay: () => void;
}) => {
  const p = getPalette(team);
  return (
    <div className="relative flex h-full items-end justify-center">
      {/* Sombra no chão */}
      <div className="absolute bottom-[3%] left-1/2 h-10 w-[22rem] -translate-x-1/2 rounded-[50%] bg-black/70 blur-xl" />
      <Portrait
        key={team}
        team={team}
        flip={team === "police"}
        backdrop={false}
        crop="full"
        className="relative mb-[2%] h-[90%] w-auto max-w-none drop-shadow-[0_30px_40px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-bottom-4 duration-700"
      />

      {/* Plaqueta do jogador */}
      <button
        type="button"
        onClick={onPlay}
        className="group absolute bottom-[3%] left-1/2 flex translate-x-[60%] flex-col items-center gap-2"
      >
        <span className="flex items-center gap-2 rounded-md bg-black/55 px-3 py-1 text-sm font-bold text-white backdrop-blur-sm">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: p.rim, boxShadow: `0 0 8px ${p.glow}` }}
          />
          {name}
        </span>
        <span
          className="flex w-20 flex-col items-center gap-1 rounded-md border bg-black/60 px-2 py-2 backdrop-blur-sm transition-colors group-hover:bg-black/80"
          style={{ borderColor: `${p.rim}66` }}
        >
          <span
            className="h-12 w-12 overflow-hidden rounded-full border-2"
            style={{ borderColor: p.rim }}
          >
            <Portrait
              team={team}
              crop="head"
              flip={team === "police"}
              className="block h-full w-full"
            />
          </span>
          <span
            className="text-[9px] font-bold uppercase tracking-widest"
            style={{ color: p.rim }}
          >
            {TEAM_LABEL[team]}
          </span>
          <span
            className="h-1 w-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${p.accent}, ${p.rim})`,
            }}
          />
        </span>
      </button>
    </div>
  );
};

/** Histórico de partidas: chega numa próxima versão. */
const HistoryPanel = () => (
  <div className="flex h-full items-center justify-center bg-black/40">
    <div className="flex flex-col items-center gap-3 text-center">
      <History size={40} className="text-zinc-500" />
      <h2 className="text-2xl font-black uppercase tracking-[0.25em]">
        Histórico
      </h2>
      <p className="max-w-sm text-sm text-zinc-400">
        Em breve: as suas partidas, vitórias e derrotas aparecem aqui.
      </p>
    </div>
  </div>
);

/** Linha da lateral: ícone fixo na coluna estreita e o texto que aparece quando ela abre. */
const SideRow = ({
  icon,
  label,
  detail,
  detailColor,
  steam = false,
  title,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  detail?: string;
  detailColor?: string;
  /** Selo da Steam, só para quem tem a conta ligada. */
  steam?: boolean;
  title: string;
  onClick?: () => void;
}) => {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      {...(onClick ? { type: "button" as const, onClick } : {})}
      title={title}
      className={`flex w-64 shrink-0 items-center text-left ${onClick ? "transition-colors hover:bg-white/10" : ""}`}
    >
      <span className="flex h-11 w-14 shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className="min-w-0 flex-1 pr-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-bold text-white">{label}</span>
          {steam && (
            <span className="shrink-0 rounded-sm bg-[#1b2838] px-1 py-px text-[8px] font-black tracking-widest text-[#66c0f4]">
              STEAM
            </span>
          )}
        </span>
        {detail && (
          <span
            className="block truncate text-[10px] uppercase tracking-widest"
            style={{ color: detailColor ?? "#a1a1aa" }}
          >
            {detail}
          </span>
        )}
      </span>
    </Tag>
  );
};

export const GameMenu = ({
  onStart,
}: {
  onStart: (setup: SetupSettings) => void;
}) => {
  useMusic("menu");
  const lobby = useGameSetup();
  const [view, setView] = useState<View>("home");
  const [fullscreen, toggleFullscreen] = useFullscreen();
  const settings = useSettings();
  const online = useOnline();
  const [panel, setPanel] = useState<"account" | "friends" | null>(null);
  const closePanel = useCallback(() => setPanel(null), []);
  const onlineFriends = online.friends.friends.filter(
    (f) => f.status !== "offline",
  );
  const pendingRequests = online.friends.incoming.length;
  // Entrou numa sala (convite aceito, Steam...): vai para a aba Jogar, no online.
  const roomId = online.room?.id;
  useEffect(() => {
    if (roomId) setView("play");
  }, [roomId]);

  const me = lobby.seats[0]?.player;
  const heroTeam: TeamName = me?.team ?? "police";
  const heroName = me?.name.trim() || "Recruta";

  // Lateral: os jogadores do lobby e o BOT no modo 1 jogador.
  const roster = [
    ...lobby.seats.map(({ player, index }) => ({
      key: `p${index}`,
      name: player.name.trim() || `Jogador ${index + 1}`,
      team: player.team,
      bot: false,
    })),
    ...(lobby.botTeam
      ? [
          {
            key: "bot",
            name: BOT_NAME,
            team: lobby.botTeam as TeamName | null,
            bot: true,
          },
        ]
      : []),
  ].filter((entry, i) => entry.bot || lobby.mode === "local" || i === 0);

  return (
    <div className="relative h-screen select-none overflow-hidden bg-[#050409] font-mono text-white">
      <Arena dim={view !== "home"} />

      {/* Barra superior */}
      <header className="absolute inset-x-0 top-0 z-20 flex h-14 items-center border-b border-white/10 bg-black/45 pr-14 backdrop-blur-md">
        <div className="flex items-center gap-1 pl-3">
          <TopIcon label="Início" onClick={() => setView("home")}>
            <Home size={18} />
          </TopIcon>
          <Link
            href="/cartas"
            aria-label="Cartas"
            title="Cartas"
            className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Layers size={18} />
          </Link>
          <TopIcon label="Configurações" onClick={() => setView("settings")}>
            <SettingsIcon size={17} />
          </TopIcon>
          <TopIcon
            label={fullscreen ? "Sair da tela cheia" : "Tela cheia"}
            onClick={toggleFullscreen}
          >
            {fullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </TopIcon>
        </div>

        <nav
          aria-label="Menu principal"
          className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1.5 lg:gap-3"
        >
          <NavTab
            label="Inventário"
            active={view === "inventory"}
            onClick={() => setView("inventory")}
          />
          <Divider />
          <NavTab label="Tutorial" href="/tutorial" />
          <Divider />
          <button
            type="button"
            onClick={() => setView("play")}
            className={`px-2 text-xl font-light uppercase tracking-[0.2em] transition-colors lg:px-4 lg:text-2xl ${
              view === "play" ? "text-white" : "text-zinc-200 hover:text-white"
            }`}
            style={
              view === "play"
                ? { textShadow: "0 0 18px rgba(201,188,255,0.8)" }
                : undefined
            }
          >
            Jogar
          </button>
          <Divider />
          <NavTab
            label="Histórico"
            active={view === "history"}
            onClick={() => setView("history")}
          />
          <Divider />
          <NavTab
            label="Configurações"
            active={view === "settings"}
            onClick={() => setView("settings")}
          />
        </nav>
      </header>

      {/* Lateral direita: conta, amigos e jogadores. Com o mouse em cima,
          abre para mostrar nomes, status e o selo da Steam. */}
      <aside className="group absolute bottom-0 right-0 top-0 z-30 flex w-14 flex-col gap-1 overflow-hidden border-l border-white/10 bg-black/55 py-3 backdrop-blur-md transition-[width,background-color] duration-200 hover:w-64 hover:bg-[#07060c]/95">
        <SideRow
          onClick={() => setPanel("account")}
          title={
            online.me
              ? `${online.me.handle} · sua conta`
              : "Entrar para jogar online"
          }
          icon={
            online.me ? (
              <Avatar user={online.me} size={34} />
            ) : (
              <LogIn size={18} />
            )
          }
          label={online.me ? online.me.handle : "Entrar"}
          detail={
            online.me
              ? online.me.kind === "account"
                ? "Sua conta"
                : "Convidado"
              : "Jogar online"
          }
          steam={!!online.me?.steam}
        />
        {online.me && (
          <SideRow
            onClick={() => setPanel("friends")}
            title="Amigos"
            icon={
              <span className="relative flex flex-col items-center text-zinc-300">
                <UserRound size={17} />
                <span className="text-[9px]">
                  {online.me.kind === "account" ? onlineFriends.length : "–"}
                </span>
                {pendingRequests > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ffb020] px-1 text-[9px] font-black text-black">
                    {pendingRequests}
                  </span>
                )}
              </span>
            }
            label="Amigos"
            detail={
              online.me.kind !== "account"
                ? "Só para contas"
                : `${onlineFriends.length} online${pendingRequests ? ` · ${pendingRequests} pedido(s)` : ""}`
            }
          />
        )}
        {onlineFriends.slice(0, 6).map((f) => (
          <SideRow
            key={f.id}
            onClick={() => setPanel("friends")}
            title={`${f.handle} · amigo`}
            icon={<Avatar user={f} size={32} />}
            label={f.handle}
            detail={STATUS_LABEL[f.status] ?? "Online"}
            detailColor={STATUS_COLOR[f.status]}
            steam={f.steam}
          />
        ))}
        <span className="mx-3 my-1 h-px bg-white/15" />
        <SideRow
          title="Jogadores"
          icon={
            <span className="flex flex-col items-center text-zinc-300">
              <Users size={18} />
              <span className="text-[9px]">{roster.length}</span>
            </span>
          }
          label="Jogadores"
          detail="Desta partida"
        />
        {roster.map(({ key, name, team, bot }) => {
          const color = team ? getPalette(team).rim : "#71717a";
          return (
            <SideRow
              key={key}
              onClick={() => setView("play")}
              title={`${name}${team ? ` · ${TEAM_LABEL[team]}` : " · sem time"}`}
              icon={
                <span
                  className="relative block h-10 w-10 overflow-hidden rounded-md border-2 bg-black"
                  style={{ borderColor: color }}
                >
                  {team ? (
                    <Portrait
                      team={team}
                      crop="head"
                      flip={team === "police"}
                      className="block h-full w-full"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-sm font-black text-zinc-400">
                      {name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  {bot && (
                    <Bot
                      size={12}
                      className="absolute bottom-0 right-0 rounded-tl bg-black/80 p-0.5 text-white"
                    />
                  )}
                </span>
              }
              label={name}
              detail={team ? TEAM_LABEL[team] : "Sem time"}
              detailColor={team ? color : undefined}
            />
          );
        })}
        <div className="mt-auto">
          <SideRow
            onClick={() => updateSettings({ muted: !settings.muted })}
            title={settings.muted ? "Ligar som" : "Desligar som"}
            icon={
              settings.muted ? (
                <VolumeX size={17} className="text-zinc-300" />
              ) : (
                <Volume2 size={17} className="text-zinc-300" />
              )
            }
            label={settings.muted ? "Som desligado" : "Som ligado"}
            detail="Clique para trocar"
          />
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="absolute bottom-0 left-0 right-14 top-14 z-10">
        {view === "home" && (
          <>
            <Hero
              team={heroTeam}
              name={heroName}
              onPlay={() => setView("play")}
            />
            <div className="pointer-events-none absolute bottom-10 left-8 max-w-xs">
              <p className="text-[10px] font-bold tracking-[0.4em] text-zinc-400">
                OPERAÇÃO TÁTICA
              </p>
              <h1 className="text-4xl font-black tracking-[0.2em] text-white drop-shadow-lg">
                CARD STRIKE
              </h1>
              <p className="mt-1 text-xs text-zinc-400">
                Cartas, dados e bombsites. Clique em JOGAR para montar os times.
              </p>
            </div>
          </>
        )}
        {view === "play" && (
          <div className="h-full overflow-y-auto bg-black/30">
            <PlayLobby
              lobby={lobby}
              onStart={onStart}
              initialOnline={!!online.room}
              key={online.room ? "online" : "local"}
            />
          </div>
        )}
        {view === "history" && <HistoryPanel />}
        {view === "settings" && <SettingsView />}
        {view === "inventory" && <InventoryView initialTeam={heroTeam} />}
      </main>

      <InviteToasts />
      {panel === "account" && <AccountPanel onClose={closePanel} />}
      {panel === "friends" && <FriendsPanel onClose={closePanel} />}

      <p className="pointer-events-none absolute bottom-1 left-2 z-20 text-[10px] text-zinc-500">
        CARD STRIKE · build de testes
      </p>
    </div>
  );
};
