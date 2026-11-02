"use client";

import type { InviteView, MatchView, QueueStatus, RoomView } from "@/lib/server/matches";
import type { FriendsView } from "@/lib/server/social";
import type { PublicUser } from "@/lib/server/users";
import type { GameAction } from "@/game/game-actions";
import type { TeamName } from "@/game/game-types";

/* ═══════════════════════════════════════════════
   API DO ONLINE (cliente)
   Uma função por rota do servidor. Erros viram
   Error com a mensagem em português do servidor.
   ═══════════════════════════════════════════════ */

export type { FriendsView, InviteView, MatchView, PublicUser, QueueStatus, RoomView };

export type MeResponse = {
  online: boolean;
  providers: { google: boolean; discord: boolean; steam: boolean };
  user: PublicUser | null;
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const call = async <T,>(path: string, method = "GET", body?: unknown): Promise<T> => {
  const response = await fetch(path, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, data.error ?? "Sem conexão com o servidor.");
  return data as T;
};

export const api = {
  me: () => call<MeResponse>("/api/me"),
  rename: (name: string) => call<{ user: PublicUser }>("/api/me", "PATCH", { name }),
  guest: (name: string) => call<{ user: PublicUser }>("/api/auth/guest", "POST", { name }),
  devLogin: (name: string) => call<{ user: PublicUser }>("/api/auth/dev", "POST", { name }),
  logout: () => call("/api/auth/logout", "POST", {}),
  presence: (status: string) => call("/api/presence", "POST", { status }),

  friends: () => call<FriendsView>("/api/friends"),
  addFriend: (handle: string) => call<FriendsView>("/api/friends", "POST", { handle }),
  removeFriend: (userId: string) => call<FriendsView>("/api/friends", "DELETE", { userId }),
  respondFriend: (userId: string, accept: boolean) => call<FriendsView>("/api/friends/respond", "POST", { userId, accept }),

  createRoom: (team: TeamName) => call<{ room: RoomView }>("/api/rooms", "POST", { team }),
  joinRoom: (code: string) => call<{ room: RoomView }>("/api/rooms/join", "POST", { code }),
  room: (id: string) => call<{ room: RoomView }>(`/api/rooms/${id}`),
  setRoomTeam: (id: string, team: TeamName) => call<{ room: RoomView }>(`/api/rooms/${id}`, "PATCH", { team }),
  leaveRoom: (id: string) => call(`/api/rooms/${id}`, "DELETE", {}),
  startRoom: (id: string) => call<{ matchId: string }>(`/api/rooms/${id}/start`, "POST", {}),
  invite: (id: string, friendId: string) => call(`/api/rooms/${id}/invite`, "POST", { friendId }),

  invites: () => call<{ invites: InviteView[] }>("/api/invites"),
  respondInvite: (id: string, accept: boolean) => call<{ room: RoomView | null }>(`/api/invites/${id}`, "POST", { accept }),

  joinQueue: () => call<QueueStatus>("/api/queue", "POST", {}),
  leaveQueue: () => call("/api/queue", "DELETE", {}),

  activeMatch: () => call<{ matchId: string | null }>("/api/matches/active"),
  match: (id: string) => call<{ match: MatchView }>(`/api/matches/${id}`),
  action: (id: string, action: GameAction) => call<{ match: MatchView }>(`/api/matches/${id}/action`, "POST", { action }),
  roll: (id: string) => call<{ match: MatchView }>(`/api/matches/${id}/roll`, "POST", {}),
  finishRoll: (id: string) => call<{ match: MatchView }>(`/api/matches/${id}/finish-roll`, "POST", {}),
  timeout: (id: string) => call<{ match: MatchView }>(`/api/matches/${id}/timeout`, "POST", {}),
  heartbeat: (id: string) =>
    call<{ opponentAwayMs: number; status: string; version: number }>(`/api/matches/${id}/heartbeat`, "POST", {}),
  claim: (id: string) => call(`/api/matches/${id}/claim`, "POST", {}),
  leaveMatch: (id: string) => call(`/api/matches/${id}/leave`, "POST", {}),
};
