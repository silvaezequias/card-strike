"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  FriendsView,
  InviteView,
  MeResponse,
  PublicUser,
  RoomView,
  api,
} from "./api";
import { subscribe } from "./realtime";
import { steam } from "@/lib/platform/steam";

/* ═══════════════════════════════════════════════
   ESTADO DO ONLINE (cliente)
   Sessão, amigos, convites, sala atual e presença,
   compartilhados por todas as telas. Os avisos do
   servidor chegam pelo canal user:<id> e só pedem
   para buscar de novo; a verdade vem sempre da API.
   ═══════════════════════════════════════════════ */

const PRESENCE_EVERY_MS = 25_000;
/** Sem mexer no mouse/teclado por isso: ausente. */
const AWAY_AFTER_MS = 3 * 60_000;
const EMPTY_FRIENDS: FriendsView = { friends: [], incoming: [], outgoing: [] };

type OnlineState = {
  ready: boolean;
  available: boolean;
  providers: MeResponse["providers"];
  me: PublicUser | null;
  friends: FriendsView;
  invites: InviteView[];
  room: RoomView | null;
  setRoom: (room: RoomView | null) => void;
  refreshMe: () => Promise<void>;
  refreshFriends: () => Promise<void>;
  refreshInvites: () => Promise<void>;
  logout: () => Promise<void>;
  /** Convida o amigo para o seu lobby; sem sala aberta, cria uma antes. */
  inviteToLobby: (friendId: string) => Promise<void>;
  /** "em partida" enquanto a tela da partida estiver aberta. */
  setInMatch: (inMatch: boolean) => void;
};

const OnlineContext = createContext<OnlineState | null>(null);

export const useOnline = () => {
  const ctx = useContext(OnlineContext);
  if (!ctx) throw new Error("useOnline fora do OnlineProvider");
  return ctx;
};

export const OnlineProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [me, setMe] = useState<PublicUser | null>(null);
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(false);
  const [providers, setProviders] = useState<MeResponse["providers"]>({
    google: false,
    discord: false,
    steam: false,
  });
  const [friends, setFriends] = useState<FriendsView>(EMPTY_FRIENDS);
  const [invites, setInvites] = useState<InviteView[]>([]);
  const [room, setRoom] = useState<RoomView | null>(null);
  const inMatch = useRef(false);
  const lastInput = useRef(Date.now());

  const refreshMe = useCallback(async () => {
    try {
      const data = await api.me();
      setAvailable(data.online);
      setProviders(data.providers);
      setMe(data.user);
    } catch {
      setAvailable(false);
    } finally {
      setReady(true);
    }
  }, []);

  const refreshFriends = useCallback(async () => {
    if (me?.kind !== "account") return setFriends(EMPTY_FRIENDS);
    try {
      setFriends(await api.friends());
    } catch {
      // mantém a lista anterior
    }
  }, [me?.kind]);

  const refreshInvites = useCallback(async () => {
    if (!me) return setInvites([]);
    try {
      setInvites((await api.invites()).invites);
    } catch {
      // mantém
    }
  }, [me]);

  const refreshRoom = useCallback(async () => {
    if (!room) return;
    try {
      const fresh = (await api.room(room.id)).room;
      setRoom(fresh.status === "closed" ? null : fresh);
      if (fresh.status === "started" && fresh.matchId)
        router.push(`/partida/${fresh.matchId}`);
    } catch {
      setRoom(null);
    }
  }, [room, router]);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    refreshFriends();
    refreshInvites();
  }, [refreshFriends, refreshInvites]);

  // Avisos pessoais e da sala.
  useEffect(() => {
    if (!me) return;
    const channels = [`user:${me.id}`, ...(room ? [`room:${room.id}`] : [])];
    return subscribe(channels, ({ channel, event, payload }) => {
      if (event === "friends_changed") refreshFriends();
      if (event === "invites_changed") refreshInvites();
      if (event === "match_started") {
        const matchId = (payload as { matchId?: string })?.matchId;
        if (matchId) router.push(`/partida/${matchId}`);
      }
      if (channel.startsWith("room:")) refreshRoom();
    });
  }, [me, room, refreshFriends, refreshInvites, refreshRoom, router]);

  // App da Steam: o amigo clicou em "Entrar no jogo" / aceitou o convite da Steam.
  useEffect(() => {
    const bridge = steam();
    if (!me || !bridge) return;
    return bridge.onJoinRequested((code) => {
      api
        .joinRoom(code)
        .then(({ room }) => setRoom(room))
        .catch(() => {});
    });
  }, [me]);

  // Presença: online, ausente (sem mexer) ou em partida.
  useEffect(() => {
    if (!me) return;
    const touch = () => (lastInput.current = Date.now());
    window.addEventListener("pointermove", touch);
    window.addEventListener("keydown", touch);
    const beat = () => {
      const status = inMatch.current
        ? "in_match"
        : Date.now() - lastInput.current > AWAY_AFTER_MS
          ? "away"
          : "online";
      api.presence(status).catch(() => {});
    };
    beat();
    const timer = window.setInterval(beat, PRESENCE_EVERY_MS);
    // Sem tempo real garantido (ex.: aba em segundo plano): revisa a lista de vez em quando.
    const refresh = window.setInterval(() => {
      refreshFriends();
      refreshInvites();
    }, 60_000);
    return () => {
      window.removeEventListener("pointermove", touch);
      window.removeEventListener("keydown", touch);
      window.clearInterval(timer);
      window.clearInterval(refresh);
    };
  }, [me, refreshFriends, refreshInvites]);

  const inviteToLobby = useCallback(
    async (friendId: string) => {
      let lobby = room?.status === "open" ? room : null;
      if (!lobby) {
        lobby = (await api.createRoom("police")).room;
        setRoom(lobby);
      }
      await api.invite(lobby.id, friendId);
    },
    [room],
  );

  const logout = useCallback(async () => {
    await api.logout().catch(() => {});
    setMe(null);
    setRoom(null);
    setFriends(EMPTY_FRIENDS);
    setInvites([]);
  }, []);

  const value = useMemo<OnlineState>(
    () => ({
      ready,
      available,
      providers,
      me,
      friends,
      invites,
      room,
      setRoom,
      refreshMe,
      refreshFriends,
      refreshInvites,
      logout,
      inviteToLobby,
      setInMatch: (value) => {
        inMatch.current = value;
        if (me) api.presence(value ? "in_match" : "online").catch(() => {});
      },
    }),
    [
      ready,
      available,
      providers,
      me,
      friends,
      invites,
      room,
      refreshMe,
      refreshFriends,
      refreshInvites,
      logout,
      inviteToLobby,
    ],
  );

  return (
    <OnlineContext.Provider value={value}>{children}</OnlineContext.Provider>
  );
};
