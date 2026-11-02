"use client";

import { useState } from "react";
import { Check, Mail, X } from "lucide-react";
import { api } from "@/lib/online/api";
import { useOnline } from "@/lib/online/online-context";
import { Avatar } from "./ui";

/* Convites para sala chegando de amigos: aviso no canto com aceitar/recusar. */

export const InviteToasts = () => {
  const { invites, refreshInvites, setRoom } = useOnline();
  const [error, setError] = useState<string | null>(null);

  if (!invites.length) return null;

  const respond = async (id: string, accept: boolean) => {
    setError(null);
    try {
      const { room } = await api.respondInvite(id, accept);
      if (room) setRoom(room);
    } catch (e) {
      setError((e as Error).message);
    }
    refreshInvites();
  };

  return (
    <div className="pointer-events-none fixed bottom-4 right-16 z-[105] flex w-72 flex-col gap-2 font-mono text-white">
      {invites.slice(0, 3).map((invite) => (
        <div
          key={invite.id}
          className="pointer-events-auto flex items-center gap-3 rounded-md border border-[#c9bcff]/40 bg-[#0b0916]/95 p-3 shadow-2xl backdrop-blur-md animate-in slide-in-from-right-6 duration-200"
        >
          <Avatar user={invite.from} size={36} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-[10px] font-bold tracking-[0.3em] text-[#c9bcff]">
              <Mail size={11} /> CONVITE
            </p>
            <p className="truncate text-sm font-bold">{invite.from.handle}</p>
            <p className="text-[11px] text-zinc-400">
              chamou você para uma partida
            </p>
          </div>
          <button
            title="Aceitar"
            onClick={() => respond(invite.id, true)}
            className="rounded-md bg-[#2fd36a] p-1.5 text-black hover:brightness-110"
          >
            <Check size={16} />
          </button>
          <button
            title="Recusar"
            onClick={() => respond(invite.id, false)}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      ))}
      {error && (
        <p className="pointer-events-auto rounded-md bg-red-500/20 px-3 py-2 text-xs text-red-200">
          {error}
        </p>
      )}
    </div>
  );
};
