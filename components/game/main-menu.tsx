"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { Bot, Home, Layers, Maximize2, Minimize2, Users, Volume2, VolumeX } from "lucide-react";
import { Portrait } from "@/components/art/noir";
import { getPalette } from "@/components/art/palette";
import { Arena } from "@/components/game/menu-arena";
import { SettingsButton, useFullscreen } from "@/components/settings/settings-panel";
import { PlayLobby } from "@/components/game/game-menu";
import { InventoryView } from "@/components/game/inventory-view";
import { SetupSettings, TeamName } from "@/game/game-types";
import { useMusic } from "@/game/useGameSounds";
import { BOT_NAME, useGameSetup } from "@/game/useSetupGame";
import { updateSettings, useSettings } from "@/lib/settings";

/* ═══════════════════════════════════════════════
   MENU PRINCIPAL
   No estilo dos jogos de tiro tático: barra no topo
   com as abas e o JOGAR no centro, ícones rápidos à
   esquerda, os jogadores na lateral direita e o
   operador em pé no meio da tela, sobre a arena.
   ═══════════════════════════════════════════════ */

type View = "home" | "play" | "news" | "inventory";

const TEAM_LABEL: Record<TeamName, string> = { police: "Polícia", faction: "Facção" };

/** Novidades do jogo, da mais nova para a mais antiga. */
const NEWS = [
  { title: "Configurações", text: "Volumes separados com mudo, brilho, contraste, FPS e modo daltônico." },
  { title: "Trilha sonora", text: "Música calma no menu, de guerra na partida e acelerada com a bomba plantada." },
  { title: "Distribuição das cartas", text: "As mãos começam vazias e três cartas saem do baralho de cada time." },
  { title: "Nova escolha de jogada", text: "Posicionar carta ou se posicionar em cartas no estilo do jogo (teclas 1 e 2)." },
  { title: "Roleta 3D", text: "A roleta dos bombsites ganhou mesa própria, vista por todos os jogadores." },
  { title: "Dado 3D com física", text: "Segure para balançar e solte para lançar o dado pela mesa inteira." },
  { title: "Modo 1 jogador", text: "Jogue contra o BOT, que rola, compra e ataca sozinho." },
];

const TopIcon = ({ label, onClick, children }: { label: string; onClick?: () => void; children: ReactNode }) => (
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

const tabClass = "px-3 py-1 text-sm font-semibold uppercase tracking-[0.15em] transition-colors";

const NavTab = ({ label, active, onClick, href }: { label: string; active?: boolean; onClick?: () => void; href?: string }) => {
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

const Divider = () => <span className="h-4 w-px bg-white/20" aria-hidden="true" />;

/** Operador em pé no centro, com a plaqueta do jogador à frente. */
const Hero = ({ team, name, onPlay }: { team: TeamName; name: string; onPlay: () => void }) => {
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
          <span className="h-2 w-2 rounded-full" style={{ background: p.rim, boxShadow: `0 0 8px ${p.glow}` }} />
          {name}
        </span>
        <span
          className="flex w-20 flex-col items-center gap-1 rounded-md border bg-black/60 px-2 py-2 backdrop-blur-sm transition-colors group-hover:bg-black/80"
          style={{ borderColor: `${p.rim}66` }}
        >
          <span className="h-12 w-12 overflow-hidden rounded-full border-2" style={{ borderColor: p.rim }}>
            <Portrait team={team} crop="head" flip={team === "police"} className="block h-full w-full" />
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: p.rim }}>
            {TEAM_LABEL[team]}
          </span>
          <span className="h-1 w-full rounded-full" style={{ background: `linear-gradient(90deg, ${p.accent}, ${p.rim})` }} />
        </span>
      </button>
    </div>
  );
};

const NewsPanel = () => (
  <div className="mx-auto flex h-full w-full max-w-2xl flex-col gap-3 overflow-y-auto px-4 py-8">
    <h2 className="text-2xl font-black uppercase tracking-[0.25em] text-white">Novidades</h2>
    {NEWS.map(({ title, text }, i) => (
      <article key={title} className="rounded-lg border border-white/10 bg-black/55 p-4 backdrop-blur-sm">
        <p className="text-[10px] font-bold tracking-[0.3em] text-[#c9bcff]">{i === 0 ? "NOVO" : "ATUALIZAÇÃO"}</p>
        <h3 className="text-base font-black uppercase tracking-wider text-white">{title}</h3>
        <p className="text-sm text-zinc-300">{text}</p>
      </article>
    ))}
  </div>
);

export const GameMenu = ({ onStart }: { onStart: (setup: SetupSettings) => void }) => {
  useMusic("menu");
  const lobby = useGameSetup();
  const [view, setView] = useState<View>("home");
  const [fullscreen, toggleFullscreen] = useFullscreen();
  const settings = useSettings();

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
    ...(lobby.botTeam ? [{ key: "bot", name: BOT_NAME, team: lobby.botTeam as TeamName | null, bot: true }] : []),
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
          <Link href="/cartas" aria-label="Cartas" title="Cartas" className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-300 transition-colors hover:bg-white/10 hover:text-white">
            <Layers size={18} />
          </Link>
          <SettingsButton className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-300 transition-colors hover:bg-white/10 hover:text-white" />
          <TopIcon label={fullscreen ? "Sair da tela cheia" : "Tela cheia"} onClick={toggleFullscreen}>
            {fullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </TopIcon>
        </div>

        <nav aria-label="Menu principal" className="absolute left-1/2 flex -translate-x-1/2 items-center gap-3">
          <NavTab label="Inventário" active={view === "inventory"} onClick={() => setView("inventory")} />
          <Divider />
          <NavTab label="Tutorial" href="/tutorial" />
          <Divider />
          <button
            type="button"
            onClick={() => setView("play")}
            className={`px-4 text-2xl font-light uppercase tracking-[0.2em] transition-colors ${
              view === "play" ? "text-white" : "text-zinc-200 hover:text-white"
            }`}
            style={view === "play" ? { textShadow: "0 0 18px rgba(201,188,255,0.8)" } : undefined}
          >
            Jogar
          </button>
          <Divider />
          <NavTab label="Novidades" active={view === "news"} onClick={() => setView("news")} />
          <Divider />
          <NavTab label="Início" active={view === "home"} onClick={() => setView("home")} />
        </nav>
      </header>

      {/* Lateral direita: jogadores */}
      <aside className="absolute bottom-0 right-0 top-0 z-30 flex w-14 flex-col items-center gap-2 border-l border-white/10 bg-black/55 py-3 backdrop-blur-md">
        <span className="flex flex-col items-center text-zinc-300" title="Jogadores">
          <Users size={18} />
          <span className="text-[9px]">{roster.length}</span>
        </span>
        <span className="h-px w-8 bg-white/15" />
        {roster.map(({ key, name, team, bot }) => {
          const color = team ? getPalette(team).rim : "#71717a";
          return (
            <button
              key={key}
              type="button"
              onClick={() => setView("play")}
              title={`${name}${team ? ` · ${TEAM_LABEL[team]}` : " · sem time"}`}
              className="relative h-10 w-10 overflow-hidden rounded-md border-2 bg-black transition-transform hover:scale-105"
              style={{ borderColor: color }}
            >
              {team ? (
                <Portrait team={team} crop="head" flip={team === "police"} className="block h-full w-full" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-sm font-black text-zinc-400">
                  {name.slice(0, 1).toUpperCase()}
                </span>
              )}
              {bot && (
                <Bot size={12} className="absolute bottom-0 right-0 rounded-tl bg-black/80 p-0.5 text-white" />
              )}
            </button>
          );
        })}
        <div className="mt-auto flex flex-col items-center gap-2">
          <TopIcon
            label={settings.muted ? "Ligar som" : "Desligar som"}
            onClick={() => updateSettings({ muted: !settings.muted })}
          >
            {settings.muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </TopIcon>
        </div>
      </aside>

      {/* Conteúdo */}
      <main className="absolute bottom-0 left-0 right-14 top-14 z-10">
        {view === "home" && (
          <>
            <Hero team={heroTeam} name={heroName} onPlay={() => setView("play")} />
            <div className="pointer-events-none absolute bottom-10 left-8 max-w-xs">
              <p className="text-[10px] font-bold tracking-[0.4em] text-zinc-400">OPERAÇÃO TÁTICA</p>
              <h1 className="text-4xl font-black tracking-[0.2em] text-white drop-shadow-lg">CARD STRIKE</h1>
              <p className="mt-1 text-xs text-zinc-400">Cartas, dados e bombsites. Clique em JOGAR para montar os times.</p>
            </div>
          </>
        )}
        {view === "play" && (
          <div className="h-full overflow-y-auto bg-black/30">
            <PlayLobby lobby={lobby} onStart={onStart} />
          </div>
        )}
        {view === "news" && <NewsPanel />}
        {view === "inventory" && <InventoryView initialTeam={heroTeam} />}
      </main>

      <p className="pointer-events-none absolute bottom-1 left-2 z-20 text-[10px] text-zinc-500">CARD STRIKE · build de testes</p>
    </div>
  );
};
