"use client";

import { FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, Send, UserMinus, UserPlus, X } from "lucide-react";
import { PublicUser, api } from "@/lib/online/api";
import { useOnline } from "@/lib/online/online-context";
import { SteamFriend, steam } from "@/lib/platform/steam";
import {
  Avatar,
  FieldError,
  STATUS_COLOR,
  STATUS_LABEL,
  ghostButton,
  inputClass,
} from "./ui";

/* ═══════════════════════════════════════════════
   AMIGOS (gaveta à direita, como na Steam)
   Amigos online e offline, pedidos, adicionar por
   Nome#1234 e convidar para a sala aberta. No app da
   Steam aparece também a lista de amigos da Steam.
   ═══════════════════════════════════════════════ */

type Tab = "friends" | "requests" | "add";

const FriendRow = ({
  user,
  canInvite,
  onInvite,
  onRemove,
}: {
  user: PublicUser;
  canInvite: boolean;
  onInvite: () => void;
  onRemove: () => void;
}) => {
  const [sent, setSent] = useState(false);
  return (
    <li className="group flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-white/5">
      <Avatar user={user} size={34} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{user.handle}</p>
        <p
          className="text-[10px] uppercase tracking-widest"
          style={{ color: STATUS_COLOR[user.status] }}
        >
          {STATUS_LABEL[user.status] ?? "Offline"}
        </p>
      </div>
      {canInvite && user.status !== "offline" && (
        <button
          className="rounded-md p-1.5 text-zinc-300 hover:bg-white/10 hover:text-white disabled:opacity-50"
          title="Convidar para a sala"
          disabled={sent}
          onClick={() => {
            onInvite();
            setSent(true);
          }}
        >
          {sent ? <Check size={15} /> : <Send size={15} />}
        </button>
      )}
      <button
        className="rounded-md p-1.5 text-zinc-500 opacity-0 hover:bg-white/10 hover:text-red-300 group-hover:opacity-100"
        title="Remover amigo"
        onClick={onRemove}
      >
        <UserMinus size={15} />
      </button>
    </li>
  );
};

const SteamFriends = ({ roomCode }: { roomCode: string | null }) => {
  const bridge = steam();
  const [friends, setFriends] = useState<SteamFriend[]>([]);
  useEffect(() => {
    bridge
      ?.getFriends()
      .then(setFriends)
      .catch(() => {});
  }, [bridge]);
  if (!bridge) return null;
  return (
    <section>
      <h3 className="mb-1 px-2 text-[10px] font-bold tracking-[0.3em] text-zinc-400">
        AMIGOS DA STEAM
      </h3>
      <ul>
        {friends.map((f) => (
          <li
            key={f.steamId}
            className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-white/5"
          >
            <Avatar
              user={{
                name: f.name,
                avatarUrl: f.avatarUrl,
                status:
                  f.state === "offline"
                    ? "offline"
                    : f.inGame
                      ? "in_match"
                      : "online",
              }}
              size={30}
            />
            <span className="min-w-0 flex-1 truncate text-sm">{f.name}</span>
            {roomCode && f.state !== "offline" && (
              <button
                className="rounded-md p-1.5 text-zinc-300 hover:bg-white/10"
                title="Convidar pela Steam"
                onClick={() => bridge.inviteToRoom(f.steamId, roomCode)}
              >
                <Send size={14} />
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};

export const FriendsPanel = ({ onClose }: { onClose: () => void }) => {
  const { me, friends, room, refreshFriends } = useOnline();
  const [tab, setTab] = useState<Tab>("friends");
  const [handle, setHandle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    refreshFriends();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [refreshFriends, onClose]);

  const run = async (fn: () => Promise<unknown>) => {
    setError(null);
    try {
      await fn();
      await refreshFriends();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const add = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      await api.addFriend(handle);
      setHandle("");
      setTab("requests");
    });
  };

  const online = friends.friends.filter((f) => f.status !== "offline");
  const offline = friends.friends.filter((f) => f.status === "offline");
  const roomOpen = room?.status === "open" ? room : null;
  const requests = friends.incoming.length;

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex justify-end bg-black/40 font-mono text-white"
      onClick={onClose}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-xs flex-col border-l border-white/10 bg-[#0b0916]/95 backdrop-blur-md animate-in slide-in-from-right-8 duration-200"
      >
        <header className="flex items-center justify-between border-b border-white/10 p-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-[0.4em] text-zinc-400">
              AMIGOS
            </p>
            <p className="flex items-center gap-1.5 truncate text-sm font-black">
              {me?.handle}
              {me && (
                <button
                  title="Copiar seu Nome#1234"
                  className="text-zinc-500 hover:text-white"
                  onClick={() => {
                    navigator.clipboard?.writeText(me.handle);
                    setCopied(true);
                  }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                </button>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-md p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </header>

        {me?.kind !== "account" ? (
          <p className="p-4 text-sm text-zinc-300">
            Lista de amigos é só para contas. Entre com Google ou Discord (no
            seu perfil) para adicionar amigos.
          </p>
        ) : (
          <>
            <nav className="grid grid-cols-3 gap-1 border-b border-white/10 p-2">
              {(
                [
                  ["friends", "Amigos"],
                  ["requests", requests ? `Pedidos (${requests})` : "Pedidos"],
                  ["add", "Adicionar"],
                ] as [Tab, string][]
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className="rounded-md px-1 py-1.5 text-[10px] font-bold uppercase tracking-widest"
                  style={
                    tab === id
                      ? { background: "#c9bcff", color: "#07060c" }
                      : {
                          color:
                            requests && id === "requests"
                              ? "#ffb020"
                              : "#a1a1aa",
                        }
                  }
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-2">
              {tab === "friends" && (
                <>
                  {roomOpen && (
                    <p className="rounded-md bg-white/5 px-2 py-1.5 text-[11px] text-zinc-300">
                      Sala <b className="text-white">{roomOpen.code}</b> aberta:
                      use o ícone de enviar para convidar.
                    </p>
                  )}
                  {[
                    ["ONLINE", online],
                    ["OFFLINE", offline],
                  ].map(([label, list]) =>
                    (list as PublicUser[]).length ? (
                      <section key={label as string}>
                        <h3 className="mb-1 px-2 text-[10px] font-bold tracking-[0.3em] text-zinc-400">
                          {label as string} ({(list as PublicUser[]).length})
                        </h3>
                        <ul>
                          {(list as PublicUser[]).map((f) => (
                            <FriendRow
                              key={f.id}
                              user={f}
                              canInvite={!!roomOpen}
                              onInvite={() =>
                                roomOpen &&
                                run(() => api.invite(roomOpen.id, f.id))
                              }
                              onRemove={() => run(() => api.removeFriend(f.id))}
                            />
                          ))}
                        </ul>
                      </section>
                    ) : null,
                  )}
                  {friends.friends.length === 0 && (
                    <p className="px-2 text-sm text-zinc-400">
                      Nenhum amigo ainda. Adicione pelo Nome#1234 na aba
                      Adicionar.
                    </p>
                  )}
                  <SteamFriends roomCode={roomOpen?.code ?? null} />
                </>
              )}

              {tab === "requests" && (
                <>
                  <section>
                    <h3 className="mb-1 px-2 text-[10px] font-bold tracking-[0.3em] text-zinc-400">
                      RECEBIDOS
                    </h3>
                    {friends.incoming.length === 0 && (
                      <p className="px-2 text-xs text-zinc-500">
                        Nenhum pedido.
                      </p>
                    )}
                    <ul>
                      {friends.incoming.map((u) => (
                        <li
                          key={u.id}
                          className="flex items-center gap-3 rounded-md px-2 py-1.5"
                        >
                          <Avatar user={u} size={30} />
                          <span className="min-w-0 flex-1 truncate text-sm">
                            {u.handle}
                          </span>
                          <button
                            className="rounded-md p-1.5 text-green-400 hover:bg-white/10"
                            title="Aceitar"
                            onClick={() =>
                              run(() => api.respondFriend(u.id, true))
                            }
                          >
                            <Check size={15} />
                          </button>
                          <button
                            className="rounded-md p-1.5 text-red-300 hover:bg-white/10"
                            title="Recusar"
                            onClick={() =>
                              run(() => api.respondFriend(u.id, false))
                            }
                          >
                            <X size={15} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section>
                    <h3 className="mb-1 px-2 text-[10px] font-bold tracking-[0.3em] text-zinc-400">
                      ENVIADOS
                    </h3>
                    {friends.outgoing.length === 0 && (
                      <p className="px-2 text-xs text-zinc-500">
                        Nenhum pedido enviado.
                      </p>
                    )}
                    <ul>
                      {friends.outgoing.map((u) => (
                        <li
                          key={u.id}
                          className="flex items-center gap-3 rounded-md px-2 py-1.5 text-zinc-400"
                        >
                          <Avatar user={u} size={30} />
                          <span className="min-w-0 flex-1 truncate text-sm">
                            {u.handle}
                          </span>
                          <span className="text-[10px] uppercase tracking-widest">
                            Aguardando
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </>
              )}

              {tab === "add" && (
                <form className="flex flex-col gap-2 p-1" onSubmit={add}>
                  <label
                    className="text-[10px] font-bold tracking-[0.3em] text-zinc-400"
                    htmlFor="friend-handle"
                  >
                    NOME#1234 DO AMIGO
                  </label>
                  <input
                    id="friend-handle"
                    className={inputClass}
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="Nome#1234"
                  />
                  <button
                    className={ghostButton}
                    disabled={!/#\d{1,4}$/.test(handle.trim())}
                  >
                    <UserPlus size={14} />
                    Enviar pedido
                  </button>
                  <p className="text-[11px] text-zinc-500">
                    Seu Nome#1234 está no topo desta lista; passe para os seus
                    amigos.
                  </p>
                </form>
              )}
              <FieldError message={error} />
            </div>
          </>
        )}
      </aside>
    </div>,
    document.body,
  );
};
