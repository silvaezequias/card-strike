"use client";

import { CSSProperties, ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { factionPalette, policePalette } from "@/components/art/palette";
import type { PublicUser } from "@/lib/online/api";

/* Peças comuns das telas do online: janela, avatar e status. */

export const ACCENT = "#c9bcff";

export const STATUS_LABEL: Record<string, string> = {
  online: "Online",
  away: "Ausente",
  in_match: "Em partida",
  offline: "Offline",
};

export const STATUS_COLOR: Record<string, string> = {
  online: "#2fd36a",
  away: "#ffb020",
  in_match: "#86e3ff",
  offline: "#52525b",
};

/** Avatar quadrado (foto do Google/Discord/Steam ou a inicial) com o status no canto. */
export const Avatar = ({
  user,
  size = 36,
}: {
  user: Pick<PublicUser, "name" | "avatarUrl" | "status">;
  size?: number;
}) => (
  <span
    className="relative inline-flex shrink-0"
    style={{ width: size, height: size }}
  >
    {user.avatarUrl ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt=""
        className="h-full w-full rounded-md object-cover"
        referrerPolicy="no-referrer"
      />
    ) : (
      <span
        className="flex h-full w-full items-center justify-center rounded-md bg-[#1d1838] font-black text-white"
        style={{ fontSize: size * 0.42 }}
      >
        {user.name.slice(0, 1).toUpperCase()}
      </span>
    )}
    <span
      className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-[#07060c]"
      style={{
        width: size * 0.32,
        height: size * 0.32,
        background: STATUS_COLOR[user.status] ?? STATUS_COLOR.offline,
      }}
    />
  </span>
);

/** Janela no estilo tático, aberta por cima de tudo (portal no body). */
export const Panel = ({
  title,
  kicker,
  onClose,
  children,
  width = "max-w-md",
}: {
  title: string;
  kicker?: string;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 font-mono backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`tactical-cut w-full ${width} p-[2px]`}
        style={
          {
            "--cut": "18px",
            background: `linear-gradient(90deg, ${policePalette.rim}, ${ACCENT}, ${factionPalette.rim})`,
          } as CSSProperties
        }
      >
        <div
          className="tactical-cut flex max-h-[85vh] flex-col gap-4 overflow-y-auto p-5 text-white"
          style={
            {
              "--cut": "17px",
              background:
                "radial-gradient(ellipse at 50% 0%, #17132a, #07060c 75%)",
            } as CSSProperties
          }
        >
          <header className="flex items-start justify-between gap-3">
            <div>
              {kicker && (
                <p className="text-[10px] font-bold tracking-[0.4em] text-zinc-400">
                  {kicker}
                </p>
              )}
              <h2 className="text-xl font-black uppercase tracking-[0.2em]">
                {title}
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="rounded-md p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </header>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export const FieldError = ({ message }: { message: string | null }) =>
  message ? (
    <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
      {message}
    </p>
  ) : null;

export const primaryButton =
  "flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40";
export const ghostButton =
  "flex items-center justify-center gap-2 rounded-md border border-white/15 bg-black/40 px-3 py-2 text-xs font-bold uppercase tracking-widest text-zinc-200 transition-colors hover:border-white/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40";
export const inputClass =
  "w-full rounded-md border border-white/15 bg-black/50 px-3 py-2 text-sm tracking-wider text-white placeholder-zinc-500 focus:border-white/50 focus:outline-none";
