"use client";

import {
  MouseEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Check, Send, UserMinus } from "lucide-react";
import { PublicUser, api } from "@/lib/online/api";
import { useOnline } from "@/lib/online/online-context";
import { Avatar, STATUS_COLOR, STATUS_LABEL } from "./ui";

/* ═══════════════════════════════════════════════
   MENU DE CONTEXTO DO AMIGO
   Clique (ou botão direito) num amigo: convidar
   para o seu lobby ou remover a amizade. O convite
   abre o lobby online, onde o dono escolhe o modo.
   ═══════════════════════════════════════════════ */

type MenuState = { friend: PublicUser; x: number; y: number };

const MENU_W = 240;

export const useFriendMenu = () => {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const open = useCallback((event: MouseEvent, friend: PublicUser) => {
    event.preventDefault();
    event.stopPropagation();
    setMenu({ friend, x: event.clientX, y: event.clientY });
  }, []);
  const close = useCallback(() => setMenu(null), []);
  return { menu, open, close };
};

export const FriendMenu = ({
  menu,
  onClose,
}: {
  menu: MenuState | null;
  onClose: () => void;
}) => {
  const { inviteToLobby, refreshFriends } = useOnline();
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [state, setState] = useState<
    "idle" | "sending" | "sent" | "confirmRemove"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setState("idle");
    setError(null);
  }, [menu?.friend.id, menu?.x, menu?.y]);

  // Mantém o menu dentro da tela.
  useLayoutEffect(() => {
    if (!menu) return;
    const h = ref.current?.offsetHeight ?? 160;
    setPos({
      x: Math.min(menu.x, window.innerWidth - MENU_W - 8),
      y: Math.min(menu.y, window.innerHeight - h - 8),
    });
  }, [menu]);

  useEffect(() => {
    if (!menu) return;
    const away = (e: PointerEvent) =>
      !ref.current?.contains(e.target as Node) && onClose();
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("pointerdown", away);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("pointerdown", away);
      window.removeEventListener("keydown", key);
    };
  }, [menu, onClose]);

  if (!menu) return null;
  const { friend } = menu;
  const offline = friend.status === "offline";

  const invite = async () => {
    setState("sending");
    setError(null);
    try {
      await inviteToLobby(friend.id);
      setState("sent");
      window.setTimeout(onClose, 900);
    } catch (e) {
      setError((e as Error).message);
      setState("idle");
    }
  };

  const remove = async () => {
    if (state !== "confirmRemove") return setState("confirmRemove");
    try {
      await api.removeFriend(friend.id);
      await refreshFriends();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const item =
    "flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-bold uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-40";

  return createPortal(
    <div
      ref={ref}
      role="menu"
      aria-label={`Ações para ${friend.handle}`}
      onContextMenu={(e) => e.preventDefault()}
      className="fixed z-[130] overflow-hidden rounded-sm border border-white/15 bg-[#0b0916]/97 font-mono text-white shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
      style={{ left: pos.x, top: pos.y, width: MENU_W }}
    >
      <div className="flex items-center gap-2.5 border-b border-white/10 px-3 py-2.5">
        <Avatar user={friend} size={30} />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-sm font-bold">
            {friend.handle}
            {friend.steam && (
              <span className="shrink-0 rounded-sm bg-[#1b2838] px-1 py-px text-[8px] font-black tracking-widest text-[#66c0f4]">
                STEAM
              </span>
            )}
          </p>
          <p
            className="text-[10px] uppercase tracking-widest"
            style={{ color: STATUS_COLOR[friend.status] }}
          >
            {STATUS_LABEL[friend.status] ?? "Offline"}
          </p>
        </div>
      </div>
      <button
        role="menuitem"
        className={`${item} text-zinc-100 hover:bg-white/10`}
        disabled={offline || state === "sending" || state === "sent"}
        onClick={invite}
        title={offline ? "O amigo está offline" : undefined}
      >
        {state === "sent" ? (
          <Check size={15} className="text-green-400" />
        ) : (
          <Send size={15} />
        )}
        {state === "sent"
          ? "Convite enviado"
          : state === "sending"
            ? "Convidando..."
            : "Convidar para o lobby"}
      </button>
      <button
        role="menuitem"
        className={`${item} ${state === "confirmRemove" ? "bg-red-600/80 text-white hover:bg-red-600" : "text-red-300 hover:bg-red-500/15"}`}
        onClick={remove}
      >
        <UserMinus size={15} />
        {state === "confirmRemove" ? "Confirmar remoção" : "Remover amizade"}
      </button>
      {error && (
        <p className="border-t border-white/10 px-3 py-2 text-[11px] text-red-300">
          {error}
        </p>
      )}
    </div>,
    document.body,
  );
};
