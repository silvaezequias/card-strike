"use client";

/* ═══════════════════════════════════════════════
   PONTE DA STEAM (cliente)
   No app de desktop (Electron + steamworks.js, pasta
   desktop/) o preload expõe window.cardStrikeSteam.
   No navegador ela não existe e tudo segue normal.

   Fluxo de convite pela Steam: o jogo grava o código
   da sala na Rich Presence ("connect"); o amigo
   clica em "Entrar no jogo" na Steam e o app recebe
   o código em onJoinRequested → entra na sala.
   ═══════════════════════════════════════════════ */

export type SteamFriend = {
  steamId: string;
  name: string;
  avatarUrl: string | null;
  /** online, away, busy, snooze, offline... (estado da Steam). */
  state: string;
  /** Jogando Card Strike agora. */
  inGame: boolean;
};

export type SteamBridge = {
  /** Ticket de sessão em hexadecimal, para entrar no servidor (/api/auth/steam). */
  getAuthTicket: () => Promise<string>;
  getFriends: () => Promise<SteamFriend[]>;
  /** Convida pela Steam para a sala (o código vai na Rich Presence "connect"). */
  inviteToRoom: (steamId: string, roomCode: string) => Promise<void>;
  setRoomPresence: (roomCode: string | null) => void;
  /** O jogador aceitou um convite/"Entrar no jogo" na Steam. */
  onJoinRequested: (handler: (roomCode: string) => void) => () => void;
};

declare global {
  interface Window {
    cardStrikeSteam?: SteamBridge;
  }
}

export const steam = (): SteamBridge | null =>
  typeof window !== "undefined" ? (window.cardStrikeSteam ?? null) : null;

/** Entra no servidor com a conta da Steam (só no app da Steam). */
export const loginWithSteam = async () => {
  const bridge = steam();
  if (!bridge)
    throw new Error("Abra o jogo pela Steam para entrar com a conta da Steam.");
  const ticket = await bridge.getAuthTicket();
  const response = await fetch("/api/auth/steam", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticket }),
  });
  if (!response.ok)
    throw new Error(
      (await response.json().catch(() => ({}))).error ??
        "Falha no login pela Steam.",
    );
};
