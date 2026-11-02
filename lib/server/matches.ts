import { GameAction } from "@/game/game-actions";
import { GameState, TeamName } from "@/game/game-types";
import { Db, getDb } from "./db";
import { publish } from "./realtime";
import { areFriends } from "./social";
import { HttpError, PublicUser, User, findUser, publicUser } from "./users";
import {
  PendingRoll,
  Snapshot,
  clientAction,
  finishRoll,
  newMatchState,
  opponentOf,
  outcome,
  startRoll,
  timeout,
} from "./match-engine";

/* ═══════════════════════════════════════════════
   SALAS, FILA E PARTIDAS (servidor)
   Sala: código de 6 letras; o dono escolhe o time,
   convida amigos e começa quando o outro entra.
   Fila: pareia os dois primeiros que estão esperando.
   Partida: cada mudança roda numa transação com a
   linha travada (for update); depois avisa match:<id>.
   Ausência: sem sinal do oponente por 60 s, quem
   ficou pode cobrar a vitória por W.O.
   ═══════════════════════════════════════════════ */

type Q = Pick<Db, "query">;

export const ABANDON_MS = 60_000;
const INVITE_TTL_MIN = 10;
const QUEUE_STALE_S = 30;

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newCode = () => Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");

/* ───────── Salas ───────── */

type RoomRow = {
  id: string;
  code: string;
  kind: "private" | "queue";
  host_id: string;
  host_team: TeamName;
  guest_id: string | null;
  status: "open" | "started" | "closed";
  match_id: string | null;
};

const ROOM_COLUMNS = "id, code, kind, host_id, host_team, guest_id, status, match_id";

export type RoomView = {
  id: string;
  code: string;
  status: RoomRow["status"];
  matchId: string | null;
  hostTeam: TeamName;
  host: PublicUser;
  guest: PublicUser | null;
  youAreHost: boolean;
};

const roomView = async (room: RoomRow, viewerId: string, db: Q): Promise<RoomView> => {
  const host = await findUser(room.host_id, db);
  const guest = room.guest_id ? await findUser(room.guest_id, db) : null;
  return {
    id: room.id,
    code: room.code,
    status: room.status,
    matchId: room.match_id,
    hostTeam: room.host_team,
    host: publicUser(host!),
    guest: guest ? publicUser(guest) : null,
    youAreHost: room.host_id === viewerId,
  };
};

const lockRoom = async (db: Q, roomId: string) => {
  const [room] = await db.query<RoomRow>(`select ${ROOM_COLUMNS} from rooms where id = $1 for update`, [roomId]);
  if (!room) throw new HttpError(404, "Sala não encontrada.");
  return room;
};

const roomChanged = (room: Pick<RoomRow, "id">) => publish(`room:${room.id}`, "room_changed");

/** Fecha as salas abertas do jogador (cada um fica em uma sala por vez). */
const leaveOpenRooms = async (db: Q, userId: string) => {
  const hosted = await db.query<{ id: string }>(
    `update rooms set status = 'closed', updated_at = now() where host_id = $1 and status = 'open' returning id`,
    [userId],
  );
  const guested = await db.query<{ id: string }>(
    `update rooms set guest_id = null, updated_at = now() where guest_id = $1 and status = 'open' returning id`,
    [userId],
  );
  return [...hosted, ...guested];
};

export const createRoom = async (user: User, team: TeamName) => {
  const db = await getDb();
  const changed = await db.tx(async (tx) => {
    const left = await leaveOpenRooms(tx, user.id);
    await tx.query(`delete from match_queue where user_id = $1`, [user.id]);
    for (let i = 0; i < 8; i++) {
      const code = newCode();
      const taken = await tx.query(`select 1 from rooms where code = $1 and status <> 'closed'`, [code]);
      if (taken.length) continue;
      const [room] = await tx.query<RoomRow>(
        `insert into rooms (code, kind, host_id, host_team) values ($1, 'private', $2, $3) returning ${ROOM_COLUMNS}`,
        [code, user.id, team === "faction" ? "faction" : "police"],
      );
      return { room, left };
    }
    throw new HttpError(503, "Não consegui criar a sala. Tente de novo.");
  });
  await Promise.all(changed.left.map(roomChanged));
  return roomView(changed.room, user.id, db);
};

export const getRoom = async (user: User, roomId: string) => {
  const db = await getDb();
  const [room] = await db.query<RoomRow>(`select ${ROOM_COLUMNS} from rooms where id = $1`, [roomId]);
  if (!room || (room.host_id !== user.id && room.guest_id !== user.id)) throw new HttpError(404, "Sala não encontrada.");
  return roomView(room, user.id, db);
};

const joinLocked = async (tx: Q, room: RoomRow, user: User) => {
  if (room.status !== "open") throw new HttpError(409, "Essa sala já começou ou foi fechada.");
  if (room.host_id === user.id) return room;
  if (room.guest_id && room.guest_id !== user.id) throw new HttpError(409, "A sala já está cheia.");
  await leaveOpenRooms(tx, user.id);
  await tx.query(`delete from match_queue where user_id = $1`, [user.id]);
  const [joined] = await tx.query<RoomRow>(
    `update rooms set guest_id = $2, updated_at = now() where id = $1 returning ${ROOM_COLUMNS}`,
    [room.id, user.id],
  );
  return joined;
};

export const joinRoomByCode = async (user: User, rawCode: string) => {
  const code = String(rawCode ?? "").trim().toUpperCase();
  const db = await getDb();
  const room = await db.tx(async (tx) => {
    const [found] = await tx.query<{ id: string }>(`select id from rooms where code = $1 and status = 'open'`, [code]);
    if (!found) throw new HttpError(404, "Nenhuma sala aberta com esse código.");
    return joinLocked(tx, await lockRoom(tx, found.id), user);
  });
  await roomChanged(room);
  return roomView(room, user.id, db);
};

export const leaveRoom = async (user: User, roomId: string) => {
  const db = await getDb();
  const room = await db.tx(async (tx) => {
    const locked = await lockRoom(tx, roomId);
    if (locked.status !== "open") return locked;
    if (locked.host_id === user.id) {
      await tx.query(`update rooms set status = 'closed', updated_at = now() where id = $1`, [roomId]);
    } else if (locked.guest_id === user.id) {
      await tx.query(`update rooms set guest_id = null, updated_at = now() where id = $1`, [roomId]);
    }
    return locked;
  });
  await roomChanged(room);
};

export const setRoomTeam = async (user: User, roomId: string, team: TeamName) => {
  const db = await getDb();
  const room = await db.tx(async (tx) => {
    const locked = await lockRoom(tx, roomId);
    if (locked.host_id !== user.id) throw new HttpError(403, "Só o dono da sala escolhe os times.");
    const [updated] = await tx.query<RoomRow>(
      `update rooms set host_team = $2, updated_at = now() where id = $1 returning ${ROOM_COLUMNS}`,
      [roomId, team === "faction" ? "faction" : "police"],
    );
    return updated;
  });
  await roomChanged(room);
  return roomView(room, user.id, db);
};

export const startRoom = async (user: User, roomId: string) => {
  const db = await getDb();
  const { room, matchId } = await db.tx(async (tx) => {
    const locked = await lockRoom(tx, roomId);
    if (locked.host_id !== user.id) throw new HttpError(403, "Só o dono da sala começa a partida.");
    if (locked.status !== "open") throw new HttpError(409, "Essa sala já começou.");
    if (!locked.guest_id) throw new HttpError(409, "Espere o outro jogador entrar.");
    const matchId = await createMatch(tx, locked);
    return { room: locked, matchId };
  });
  await announceMatch(room, matchId);
  return matchId;
};

/* ───────── Convites ───────── */

export const inviteFriend = async (user: User, roomId: string, friendId: string) => {
  if (user.kind !== "account") throw new HttpError(403, "Crie uma conta para convidar amigos.");
  if (!(await areFriends(user.id, friendId))) throw new HttpError(403, "Só dá para convidar amigos.");
  const db = await getDb();
  const [room] = await db.query<RoomRow>(`select ${ROOM_COLUMNS} from rooms where id = $1 and status = 'open'`, [roomId]);
  if (!room || (room.host_id !== user.id && room.guest_id !== user.id)) throw new HttpError(404, "Sala não encontrada.");
  await db.query(`update invites set status = 'expired' where room_id = $1 and to_id = $2 and status = 'pending'`, [roomId, friendId]);
  await db.query(`insert into invites (room_id, from_id, to_id) values ($1, $2, $3)`, [roomId, user.id, friendId]);
  await publish(`user:${friendId}`, "invites_changed");
};

export type InviteView = { id: string; from: PublicUser; roomCode: string; createdAt: string };

export const listInvites = async (user: User): Promise<InviteView[]> => {
  const db = await getDb();
  const rows = await db.query<{ id: string; from_id: string; code: string; created_at: string }>(
    `select i.id, i.from_id, r.code, i.created_at
       from invites i join rooms r on r.id = i.room_id
      where i.to_id = $1 and i.status = 'pending' and r.status = 'open'
        and i.created_at > now() - interval '${INVITE_TTL_MIN} minutes'
      order by i.created_at desc`,
    [user.id],
  );
  const views: InviteView[] = [];
  for (const row of rows) {
    const from = await findUser(row.from_id, db);
    if (from) views.push({ id: row.id, from: publicUser(from), roomCode: row.code, createdAt: String(row.created_at) });
  }
  return views;
};

export const respondInvite = async (user: User, inviteId: string, accept: boolean) => {
  const db = await getDb();
  const [invite] = await db.query<{ room_id: string; from_id: string }>(
    `update invites set status = $3 where id = $1 and to_id = $2 and status = 'pending' returning room_id, from_id`,
    [inviteId, user.id, accept ? "accepted" : "declined"],
  );
  if (!invite) throw new HttpError(404, "Convite não encontrado.");
  if (!accept) {
    await publish(`user:${invite.from_id}`, "invites_changed");
    return null;
  }
  const room = await db.tx(async (tx) => joinLocked(tx, await lockRoom(tx, invite.room_id), user));
  await roomChanged(room);
  return roomView(room, user.id, db);
};

/* ───────── Fila pública ───────── */

export type QueueStatus = { status: "idle" | "waiting" | "matched"; matchId?: string };

export const joinQueue = async (user: User): Promise<QueueStatus> => {
  const db = await getDb();
  const result = await db.tx(async (tx) => {
    await leaveOpenRooms(tx, user.id);
    await tx.query(`delete from match_queue where seen_at < now() - interval '${QUEUE_STALE_S} seconds'`);
    const [other] = await tx.query<{ user_id: string }>(
      `select user_id from match_queue where user_id <> $1 order by created_at limit 1 for update skip locked`,
      [user.id],
    );
    if (!other) {
      await tx.query(
        `insert into match_queue (user_id) values ($1) on conflict (user_id) do update set seen_at = now()`,
        [user.id],
      );
      return { status: "waiting" as const };
    }
    await tx.query(`delete from match_queue where user_id in ($1, $2)`, [user.id, other.user_id]);
    // Quem esperava mais começa como dono; o time é sorteado.
    const [room] = await tx.query<RoomRow>(
      `insert into rooms (code, kind, host_id, host_team, guest_id) values ($1, 'queue', $2, $3, $4) returning ${ROOM_COLUMNS}`,
      [newCode(), other.user_id, Math.random() < 0.5 ? "police" : "faction", user.id],
    );
    const matchId = await createMatch(tx, room);
    return { status: "matched" as const, matchId, room };
  });
  if (result.status === "matched") {
    await announceMatch(result.room, result.matchId);
    return { status: "matched", matchId: result.matchId };
  }
  return result;
};

export const leaveQueue = async (user: User) => {
  const db = await getDb();
  await db.query(`delete from match_queue where user_id = $1`, [user.id]);
};

/* ───────── Partidas ───────── */

type MatchRow = {
  id: string;
  room_id: string | null;
  police_id: string;
  faction_id: string;
  state: GameState;
  version: number;
  deadline: string | null;
  pending_roll: PendingRoll | null;
  status: "active" | "finished";
  winner: TeamName | null;
  end_reason: string | null;
  police_seen: string;
  faction_seen: string;
  created_at: string;
};

const MATCH_COLUMNS =
  "id, room_id, police_id, faction_id, state, version, deadline, pending_roll, status, winner, end_reason, police_seen, faction_seen, created_at";

const parseJson = <T,>(value: unknown): T => (typeof value === "string" ? (JSON.parse(value) as T) : (value as T));

const createMatch = async (tx: Q, room: RoomRow) => {
  const policeId = room.host_team === "police" ? room.host_id : room.guest_id!;
  const factionId = room.host_team === "police" ? room.guest_id! : room.host_id;
  const police = await findUser(policeId, tx);
  const faction = await findUser(factionId, tx);
  const state = newMatchState(police!.name, faction!.name);
  const [match] = await tx.query<{ id: string }>(
    `insert into matches (room_id, police_id, faction_id, state, deadline)
     values ($1, $2, $3, $4, now() + interval '60 seconds') returning id`,
    [room.id, policeId, factionId, JSON.stringify(state)],
  );
  await tx.query(`update rooms set status = 'started', match_id = $2, updated_at = now() where id = $1`, [room.id, match.id]);
  await tx.query(`update users set status = 'in_match', last_seen = now() where id in ($1, $2)`, [policeId, factionId]);
  return match.id;
};

const announceMatch = async (room: RoomRow, matchId: string) => {
  await roomChanged(room);
  await publish(`user:${room.host_id}`, "match_started", { matchId });
  if (room.guest_id) await publish(`user:${room.guest_id}`, "match_started", { matchId });
};

const teamOf = (match: MatchRow, userId: string): TeamName | null =>
  match.police_id === userId ? "police" : match.faction_id === userId ? "faction" : null;

export type MatchView = {
  id: string;
  version: number;
  status: MatchRow["status"];
  winner: TeamName | null;
  endReason: string | null;
  you: TeamName;
  state: GameState;
  deadline: number | null;
  pendingRoll: PendingRoll | null;
  startedAt: number;
  serverNow: number;
  players: Record<TeamName, PublicUser & { lastSeenMs: number }>;
};

const view = async (match: MatchRow, you: TeamName, db: Q): Promise<MatchView> => {
  const police = await findUser(match.police_id, db);
  const faction = await findUser(match.faction_id, db);
  const now = Date.now();
  return {
    id: match.id,
    version: Number(match.version),
    status: match.status,
    winner: match.winner,
    endReason: match.end_reason,
    you,
    state: parseJson<GameState>(match.state),
    deadline: match.deadline ? new Date(match.deadline).getTime() : null,
    pendingRoll: parseJson<PendingRoll | null>(match.pending_roll),
    startedAt: new Date(match.created_at).getTime(),
    serverNow: now,
    players: {
      police: { ...publicUser(police!), lastSeenMs: now - new Date(match.police_seen).getTime() },
      faction: { ...publicUser(faction!), lastSeenMs: now - new Date(match.faction_seen).getTime() },
    },
  };
};

const loadForUser = async (db: Q, matchId: string, userId: string, lock = false) => {
  const [match] = await db.query<MatchRow>(
    `select ${MATCH_COLUMNS} from matches where id = $1${lock ? " for update" : ""}`,
    [matchId],
  );
  const team = match ? teamOf(match, userId) : null;
  if (!match || !team) throw new HttpError(404, "Partida não encontrada.");
  return { match, team };
};

export const getMatch = async (user: User, matchId: string) => {
  const db = await getDb();
  const { match, team } = await loadForUser(db, matchId, user.id);
  return view(match, team, db);
};

/** Partida em andamento do jogador, se houver (para voltar depois de cair). */
export const activeMatchId = async (user: User) => {
  const db = await getDb();
  const [row] = await db.query<{ id: string }>(
    `select id from matches where status = 'active' and (police_id = $1 or faction_id = $1) order by created_at desc limit 1`,
    [user.id],
  );
  return row?.id ?? null;
};

const finishRow = async (tx: Q, match: MatchRow, winner: TeamName, reason: string) => {
  await tx.query(
    `update matches set status = 'finished', winner = $2, end_reason = $3, pending_roll = null, deadline = null,
       version = version + 1, updated_at = now() where id = $1`,
    [match.id, winner, reason],
  );
  if (match.room_id) await tx.query(`update rooms set status = 'closed', updated_at = now() where id = $1`, [match.room_id]);
  await tx.query(`update users set status = 'online' where id in ($1, $2) and status = 'in_match'`, [match.police_id, match.faction_id]);
};

type Change = (snap: Snapshot, team: TeamName, now: number) => Snapshot;

/** Aplica uma mudança na partida dentro de uma transação e avisa os dois lados. */
const mutate = async (user: User, matchId: string, change: Change) => {
  const db = await getDb();
  const result = await db.tx(async (tx) => {
    const { match, team } = await loadForUser(tx, matchId, user.id, true);
    if (match.status !== "active") throw new HttpError(409, "A partida já acabou.");
    const now = Date.now();
    const snap: Snapshot = {
      state: parseJson<GameState>(match.state),
      deadline: match.deadline ? new Date(match.deadline).getTime() : null,
      pendingRoll: parseJson<PendingRoll | null>(match.pending_roll),
    };
    const next = change(snap, team, now);
    const seenColumn = team === "police" ? "police_seen" : "faction_seen";
    await tx.query(
      `update matches set state = $2, deadline = $3, pending_roll = $4, version = version + 1, ${seenColumn} = now(), updated_at = now()
        where id = $1`,
      [
        match.id,
        JSON.stringify(next.state),
        next.deadline ? new Date(next.deadline).toISOString() : null,
        next.pendingRoll ? JSON.stringify(next.pendingRoll) : null,
      ],
    );
    const winner = outcome(next.state);
    if (winner) await finishRow(tx, match, winner, next.state.bomb.exploded ? "bomb" : "eliminated");
    const [fresh] = await tx.query<MatchRow>(`select ${MATCH_COLUMNS} from matches where id = $1`, [match.id]);
    return view(fresh, team, tx);
  });
  await publish(`match:${matchId}`, "match_changed", { version: result.version });
  return result;
};

export const playAction = (user: User, matchId: string, action: GameAction) =>
  mutate(user, matchId, (snap, team, now) => clientAction(snap, team, action, now));

export const playRoll = (user: User, matchId: string) =>
  mutate(user, matchId, (snap, team, now) => startRoll(snap, team, now));

/** Fim da animação do sorteio (quem rolou avisa; o outro pode cobrar depois do prazo). */
export const playFinishRoll = (user: User, matchId: string) =>
  mutate(user, matchId, (snap, team, now) => {
    if (snap.pendingRoll?.team !== team && (snap.deadline ?? 0) > now) throw new HttpError(409, "Espere o sorteio terminar.");
    return finishRoll(snap, now);
  });

export const playTimeout = (user: User, matchId: string) => mutate(user, matchId, (snap, _team, now) => timeout(snap, now));

/** Sinal de vida do jogador na partida; devolve há quanto tempo o oponente sumiu. */
export const matchHeartbeat = async (user: User, matchId: string) => {
  const db = await getDb();
  const { match, team } = await loadForUser(db, matchId, user.id);
  await db.query(`update matches set ${team === "police" ? "police_seen" : "faction_seen"} = now() where id = $1`, [match.id]);
  await db.query(`update users set status = 'in_match', last_seen = now() where id = $1 and $2 = 'active'`, [user.id, match.status]);
  const opponentSeen = new Date(team === "police" ? match.faction_seen : match.police_seen).getTime();
  return { opponentAwayMs: Date.now() - opponentSeen, status: match.status, version: Number(match.version) };
};

/** Oponente sumido há mais de 60 s: quem ficou ganha por W.O. */
export const claimAbandon = async (user: User, matchId: string) => {
  const db = await getDb();
  await db.tx(async (tx) => {
    const { match, team } = await loadForUser(tx, matchId, user.id, true);
    if (match.status !== "active") return;
    const opponentSeen = new Date(team === "police" ? match.faction_seen : match.police_seen).getTime();
    if (Date.now() - opponentSeen < ABANDON_MS) throw new HttpError(409, "O oponente ainda pode voltar.");
    await finishRow(tx, match, team, "abandon");
  });
  await publish(`match:${matchId}`, "match_changed");
};

/** Sair da partida: o outro vence por W.O. */
export const leaveMatch = async (user: User, matchId: string) => {
  const db = await getDb();
  await db.tx(async (tx) => {
    const { match, team } = await loadForUser(tx, matchId, user.id, true);
    if (match.status !== "active") return;
    await finishRow(tx, match, opponentOf(team), "left");
  });
  await publish(`match:${matchId}`, "match_changed");
};
