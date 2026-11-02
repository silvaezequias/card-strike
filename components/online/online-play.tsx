"use client";

import {
  CSSProperties,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  Check,
  Copy,
  Crosshair,
  DoorOpen,
  Hash,
  Loader2,
  LogIn,
  Play,
  Search,
  Send,
  Shield,
  Swords,
  X,
} from "lucide-react";
import { factionPalette, policePalette } from "@/components/art/palette";
import { PublicUser, RoomView, api } from "@/lib/online/api";
import { useOnline } from "@/lib/online/online-context";
import { steam } from "@/lib/platform/steam";
import { GameRules, TeamName } from "@/game/game-types";
import { AccountPanel } from "./account-panel";
import { FriendsPanel } from "./friends-panel";
import { Avatar, FieldError, ghostButton, inputClass } from "./ui";

/* ═══════════════════════════════════════════════
   JOGAR ONLINE
   Três jeitos de achar o oponente: criar uma sala e
   passar o código (ou convidar um amigo), entrar com
   um código, ou a fila pública. A partida começa no
   servidor e os dois vão para /partida/<id>.
   ═══════════════════════════════════════════════ */

const GO = "#2fd36a";
const QUEUE_POLL_MS = 5_000;

const TEAM: Record<
  TeamName,
  { label: string; color: string; Icon: typeof Shield }
> = {
  police: { label: "Polícia", color: policePalette.rim, Icon: Shield },
  faction: { label: "Facção", color: factionPalette.rim, Icon: Crosshair },
};

const other = (team: TeamName): TeamName =>
  team === "police" ? "faction" : "police";

const Seat = ({
  user,
  team,
  label,
}: {
  user: PublicUser | null;
  team: TeamName;
  label: string;
}) => {
  const { color, label: teamLabel, Icon } = TEAM[team];
  return (
    <div
      className="flex flex-1 flex-col items-center gap-2 rounded-md border-2 bg-black/50 p-4"
      style={{ borderColor: user ? color : "#3f3f46" }}
    >
      <p
        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.3em]"
        style={{ color }}
      >
        <Icon size={12} /> {teamLabel}
      </p>
      {user ? (
        <>
          <Avatar user={user} size={64} />
          <p className="max-w-full truncate text-sm font-black">
            {user.handle}
          </p>
        </>
      ) : (
        <>
          <span className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-zinc-600">
            <Loader2 size={22} className="animate-spin text-zinc-500" />
          </span>
          <p className="text-xs text-zinc-500">Esperando oponente</p>
        </>
      )}
      <p className="text-[10px] uppercase tracking-widest text-zinc-500">
        {label}
      </p>
    </div>
  );
};

const GoButton = ({
  disabled,
  onClick,
  children,
}: {
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex items-center gap-3 px-10 py-3 text-lg font-black uppercase tracking-[0.3em] text-white transition-[filter,opacity] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
    style={
      {
        background: `linear-gradient(180deg, ${GO}, #13853c)`,
        boxShadow: disabled
          ? undefined
          : `0 0 24px ${GO}88, inset 0 0 0 2px #7dffab`,
      } as CSSProperties
    }
  >
    {children}
  </button>
);

/** Modos online: por enquanto só o Bombsite. */
const ONLINE_MODES = [
  {
    id: "bombsite",
    label: "Bombsite",
    detail: "Polícia x Facção · rodadas de 60 s",
    ready: true,
  },
  { id: "soon-1", label: "Em breve", detail: "Novo modo", ready: false },
  { id: "soon-2", label: "Em breve", detail: "Novo modo", ready: false },
];

/** Modo de jogo e regras da sala: o dono escolhe, o convidado só vê. */
const RoomOptions = ({
  room,
  disabled,
  onChange,
}: {
  room: RoomView;
  disabled: boolean;
  onChange: (changes: { mode?: string; rules?: GameRules }) => void;
}) => {
  const editable = room.youAreHost && !disabled;
  return (
    <section className="flex w-full max-w-xl flex-col gap-3 rounded-md border border-white/10 bg-black/50 p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-xs font-black uppercase tracking-widest">
          Modo de jogo
        </h3>
        {!room.youAreHost && (
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">
            O dono da sala escolhe
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {ONLINE_MODES.map((m) => {
          const selected = m.ready && room.mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              disabled={!editable || !m.ready}
              onClick={() => onChange({ mode: m.id })}
              className="flex flex-col items-start gap-0.5 rounded-sm border px-3 py-2 text-left transition-colors disabled:cursor-default"
              style={{
                borderColor: selected ? GO : "rgba(255,255,255,0.12)",
                background: selected ? `${GO}1f` : "rgba(0,0,0,0.3)",
                opacity: m.ready ? 1 : 0.4,
              }}
            >
              <span className="flex items-center gap-1.5 text-sm font-black uppercase tracking-wider">
                {selected && <Check size={14} style={{ color: GO }} />}
                {m.label}
              </span>
              <span className="text-[10px] text-zinc-400">{m.detail}</span>
            </button>
          );
        })}
      </div>
      <h3 className="mt-1 text-xs font-black uppercase tracking-widest">
        Regras
      </h3>
      <button
        type="button"
        role="switch"
        aria-checked={room.rules.hiddenCards}
        disabled={!editable}
        onClick={() =>
          onChange({
            rules: { ...room.rules, hiddenCards: !room.rules.hiddenCards },
          })
        }
        className="flex items-start gap-3 rounded-sm border border-white/10 bg-black/40 p-2.5 text-left transition-colors enabled:hover:border-white/30 disabled:cursor-default"
      >
        <span
          className="relative mt-0.5 h-4 w-8 shrink-0 rounded-full transition-colors"
          style={{ background: room.rules.hiddenCards ? GO : "#3f3f46" }}
        >
          <span
            className="absolute top-0.5 h-3 w-3 rounded-full bg-white transition-[left]"
            style={{ left: room.rules.hiddenCards ? 18 : 2 }}
          />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-xs font-bold uppercase tracking-wider">
            Cartas ocultas
          </span>
          <span className="text-[11px] leading-snug text-zinc-400">
            Ninguém vê as cartas do oponente, nem na mão nem nos 6 slots, até
            ele jogar.
          </span>
        </span>
      </button>
    </section>
  );
};

export const OnlinePlay = () => {
  const router = useRouter();
  const { ready, available, me, room, setRoom } = useOnline();
  const [team, setTeam] = useState<TeamName>("police");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [queueSince, setQueueSince] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [panel, setPanel] = useState<"account" | "friends" | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeMatch, setActiveMatch] = useState<string | null>(null);
  const queueing = useRef(false);
  const closePanel = useCallback(() => setPanel(null), []);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Partida em andamento (ex.: fechou a aba sem querer): oferece voltar.
  useEffect(() => {
    if (!me) return;
    api
      .activeMatch()
      .then(({ matchId }) => setActiveMatch(matchId))
      .catch(() => {});
  }, [me]);

  // Sala aberta: o código vai para a Steam (para o "Entrar no jogo").
  useEffect(() => {
    steam()?.setRoomPresence(room?.status === "open" ? room.code : null);
  }, [room?.status, room?.code]);

  // Fila: renova a vaga e tenta parear a cada poucos segundos.
  useEffect(() => {
    if (queueSince === null) return;
    queueing.current = true;
    const tick = async () => {
      try {
        const status = await api.joinQueue();
        if (status.status === "matched" && status.matchId && queueing.current) {
          queueing.current = false;
          router.push(`/partida/${status.matchId}`);
        }
      } catch (e) {
        setError((e as Error).message);
      }
    };
    const poll = window.setInterval(tick, QUEUE_POLL_MS);
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearInterval(poll);
      window.clearInterval(clock);
    };
  }, [queueSince, router]);

  const enterQueue = () =>
    run(async () => {
      const status = await api.joinQueue();
      if (status.status === "matched" && status.matchId)
        return router.push(`/partida/${status.matchId}`);
      setNow(Date.now());
      setQueueSince(Date.now());
    });

  const leaveQueue = () => {
    queueing.current = false;
    setQueueSince(null);
    api.leaveQueue().catch(() => {});
  };

  // Sai da fila ao sair da tela.
  useEffect(
    () => () => void (queueing.current && api.leaveQueue().catch(() => {})),
    [],
  );

  const join = (e: FormEvent) => {
    e.preventDefault();
    run(async () => setRoom((await api.joinRoom(code)).room));
  };

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center text-zinc-400">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!available) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="max-w-md rounded-md bg-black/60 p-5 text-center text-sm text-zinc-300">
          O modo online ainda não está configurado neste servidor. As partidas
          de 1 jogador e locais continuam funcionando.
        </p>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <Swords size={40} className="text-[#c9bcff]" />
        <h2 className="text-2xl font-black uppercase tracking-[0.25em]">
          Jogar online
        </h2>
        <p className="max-w-sm text-sm text-zinc-300">
          Entre com Google ou Discord para ter lista de amigos, ou só escolha um
          nick para jogar como convidado.
        </p>
        <button
          className={`${ghostButton} px-6 py-3`}
          onClick={() => setPanel("account")}
        >
          <LogIn size={16} /> Entrar
        </button>
        {panel === "account" && <AccountPanel onClose={closePanel} />}
      </div>
    );
  }

  // Dentro de uma sala.
  if (room && room.status !== "closed") {
    const hostTeam = room.hostTeam;
    const ready = !!room.guest;
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col items-center gap-5 overflow-y-auto px-6 py-6">
          <div className="flex flex-col items-center gap-1">
            <p className="text-[10px] font-bold tracking-[0.4em] text-zinc-400">
              CÓDIGO DA SALA
            </p>
            <button
              className="flex items-center gap-3 rounded-md border border-white/15 bg-black/60 px-5 py-2 text-3xl font-black tracking-[0.4em] hover:border-white/40"
              title="Copiar o código"
              onClick={() => {
                navigator.clipboard?.writeText(room.code);
                setCopied(true);
              }}
            >
              {room.code}
              {copied ? (
                <Check size={18} className="text-green-400" />
              ) : (
                <Copy size={18} className="text-zinc-400" />
              )}
            </button>
            <p className="text-[11px] text-zinc-500">
              Passe o código para o seu oponente ou convide um amigo.
            </p>
          </div>

          <div className="flex w-full max-w-xl items-stretch gap-4">
            <Seat
              user={room.host}
              team={hostTeam}
              label={room.youAreHost ? "Você · dono da sala" : "Dono da sala"}
            />
            <span className="flex items-center text-xl font-black text-zinc-500">
              VS
            </span>
            <Seat
              user={room.guest}
              team={other(hostTeam)}
              label={room.guest && !room.youAreHost ? "Você" : "Convidado"}
            />
          </div>

          <RoomOptions
            room={room}
            disabled={busy}
            onChange={(changes) =>
              run(async () =>
                setRoom((await api.updateRoom(room.id, changes)).room),
              )
            }
          />

          <div className="flex flex-wrap justify-center gap-2">
            {room.youAreHost && (
              <button
                className={ghostButton}
                disabled={busy}
                onClick={() =>
                  run(async () =>
                    setRoom(
                      (await api.setRoomTeam(room.id, other(hostTeam))).room,
                    ),
                  )
                }
              >
                <ArrowLeftRight size={14} /> Trocar de lado
              </button>
            )}
            {room.youAreHost && !room.guest && (
              <button
                className={ghostButton}
                onClick={() => setPanel("friends")}
                disabled={me.kind !== "account" && !steam()}
              >
                <Send size={14} /> Convidar amigo
              </button>
            )}
            <button
              className={ghostButton}
              onClick={() =>
                run(async () => {
                  await api.leaveRoom(room.id);
                  setRoom(null);
                  setCopied(false);
                })
              }
            >
              <DoorOpen size={14} /> Sair da sala
            </button>
          </div>
          <FieldError message={error} />
        </div>

        <footer className="flex items-center justify-end gap-4 border-t border-white/10 bg-black/40 px-6 py-3 backdrop-blur-sm">
          <p className="text-[11px] uppercase tracking-widest text-zinc-400">
            {!ready
              ? "Esperando o oponente entrar"
              : room.youAreHost
                ? "Tudo pronto"
                : "Esperando o dono da sala começar"}
          </p>
          {room.youAreHost && (
            <GoButton
              disabled={!ready || busy}
              onClick={() => run(() => api.startRoom(room.id))}
            >
              <Play size={20} fill="white" /> Jogar
            </GoButton>
          )}
        </footer>
        {panel === "friends" && <FriendsPanel onClose={closePanel} />}
      </div>
    );
  }

  const waited = queueSince
    ? Math.max(0, Math.floor((now - queueSince) / 1000))
    : 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto px-6 py-5 md:grid-cols-3">
        {activeMatch && (
          <button
            onClick={() => router.push(`/partida/${activeMatch}`)}
            className="col-span-full flex items-center justify-center gap-2 rounded-md border border-[#ffb020]/60 bg-[#ffb020]/10 px-4 py-3 text-sm font-bold uppercase tracking-widest text-[#ffb020] hover:bg-[#ffb020]/20"
          >
            <Play size={16} /> Você tem uma partida em andamento: voltar para
            ela
          </button>
        )}

        {/* Criar sala */}
        <section className="flex flex-col gap-3 rounded-md border border-white/10 bg-black/50 p-4">
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
            <Hash size={16} className="text-[#c9bcff]" /> Criar sala
          </h3>
          <p className="text-xs text-zinc-400">
            Gera um código para passar ao oponente. Seus amigos podem ser
            convidados direto.
          </p>
          <div className="flex gap-1">
            {(["police", "faction"] as TeamName[]).map((t) => {
              const { label, color, Icon } = TEAM[t];
              return (
                <button
                  key={t}
                  onClick={() => setTeam(t)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-sm border px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider"
                  style={
                    team === t
                      ? {
                          borderColor: color,
                          background: `${color}26`,
                          color: "#fff",
                        }
                      : { borderColor: "#ffffff22", color: "#a1a1aa" }
                  }
                >
                  <Icon size={13} style={{ color }} /> {label}
                </button>
              );
            })}
          </div>
          <button
            className={`${ghostButton} mt-auto`}
            disabled={busy || queueSince !== null}
            onClick={() =>
              run(async () => setRoom((await api.createRoom(team)).room))
            }
          >
            Criar sala
          </button>
        </section>

        {/* Entrar com código */}
        <form
          onSubmit={join}
          className="flex flex-col gap-3 rounded-md border border-white/10 bg-black/50 p-4"
        >
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
            <LogIn size={16} className="text-[#c9bcff]" /> Entrar com código
          </h3>
          <p className="text-xs text-zinc-400">
            Digite o código que o dono da sala passou.
          </p>
          <input
            className={`${inputClass} text-center text-lg font-black uppercase tracking-[0.4em]`}
            value={code}
            onChange={(e) =>
              setCode(
                e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "")
                  .slice(0, 6),
              )
            }
            placeholder="CÓDIGO"
            aria-label="Código da sala"
          />
          <button
            className={`${ghostButton} mt-auto`}
            disabled={busy || code.length < 6 || queueSince !== null}
          >
            Entrar na sala
          </button>
        </form>

        {/* Fila pública */}
        <section className="flex flex-col gap-3 rounded-md border border-white/10 bg-black/50 p-4">
          <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest">
            <Search size={16} className="text-[#c9bcff]" /> Fila pública
          </h3>
          <p className="text-xs text-zinc-400">
            Joga contra quem estiver procurando partida agora. Os lados são
            sorteados.
          </p>
          {queueSince !== null ? (
            <div className="mt-auto flex flex-col items-center gap-2">
              <p className="flex items-center gap-2 text-sm font-bold text-[#2fd36a]">
                <Loader2 size={16} className="animate-spin" />
                Procurando · {Math.floor(waited / 60)}:
                {String(waited % 60).padStart(2, "0")}
              </p>
              <button className={`${ghostButton} w-full`} onClick={leaveQueue}>
                <X size={14} /> Cancelar
              </button>
            </div>
          ) : (
            <button
              className={`${ghostButton} mt-auto`}
              disabled={busy}
              onClick={enterQueue}
            >
              Procurar partida
            </button>
          )}
        </section>

        <div className="col-span-full">
          <FieldError message={error} />
        </div>
      </div>
      <footer className="flex items-center justify-between gap-4 border-t border-white/10 bg-black/40 px-6 py-3 text-[11px] text-zinc-400 backdrop-blur-sm">
        <span className="flex items-center gap-2">
          <Avatar user={me} size={22} /> {me.handle}
          {me.kind === "guest" && (
            <span className="text-zinc-500">· convidado</span>
          )}
        </span>
        <span className="uppercase tracking-widest">
          Se a conexão cair, você tem 60 s para voltar à partida
        </span>
      </footer>
    </div>
  );
};
