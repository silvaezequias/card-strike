import { getDb } from "./db";
import { publish } from "./realtime";
import { HttpError, ONLINE_WINDOW_MS, PublicUser, User, publicUser } from "./users";

/* ═══════════════════════════════════════════════
   AMIGOS E PRESENÇA
   Só contas têm amigos. A amizade é um par ordenado
   (menor id, maior id) com estado pendente/aceita.
   Presença: o cliente avisa a cada ~25 s (online,
   ausente ou em partida); sem aviso há 75 s, offline.
   ═══════════════════════════════════════════════ */

export type PresenceStatus = "online" | "away" | "in_match";

const PRESENCE: PresenceStatus[] = ["online", "away", "in_match"];

const pair = (a: string, b: string) => (a < b ? [a, b] : [b, a]);

const friendIds = async (userId: string) => {
  const db = await getDb();
  const rows = await db.query<{ id: string }>(
    `select case when user_low = $1 then user_high else user_low end as id
       from friendships where (user_low = $1 or user_high = $1) and status = 'accepted'`,
    [userId],
  );
  return rows.map((r) => r.id);
};

/** Avisa os amigos (sinal para buscar a lista de novo). */
const notifyFriends = async (userId: string) => {
  for (const id of await friendIds(userId)) await publish(`user:${id}`, "friends_changed");
};

export const heartbeat = async (user: User, status: string) => {
  const next = PRESENCE.includes(status as PresenceStatus) ? status : "online";
  const db = await getDb();
  const wasOnline = Date.now() - new Date(user.last_seen).getTime() < ONLINE_WINDOW_MS;
  await db.query(`update users set status = $2, last_seen = now() where id = $1`, [user.id, next]);
  if (user.kind === "account" && (!wasOnline || user.status !== next)) await notifyFriends(user.id);
};

export type FriendsView = {
  friends: PublicUser[];
  incoming: PublicUser[];
  outgoing: PublicUser[];
};

export const listFriends = async (user: User): Promise<FriendsView> => {
  const db = await getDb();
  const rows = await db.query<User & { f_status: string; requested_by: string }>(
    `select u.id, u.kind, u.name, u.tag, u.avatar_url, u.status, u.last_seen, u.steam_id,
            f.status as f_status, f.requested_by
       from friendships f
       join users u on u.id = case when f.user_low = $1 then f.user_high else f.user_low end
      where f.user_low = $1 or f.user_high = $1`,
    [user.id],
  );
  const view: FriendsView = { friends: [], incoming: [], outgoing: [] };
  for (const row of rows) {
    const pub = publicUser(row);
    if (row.f_status === "accepted") view.friends.push(pub);
    else if (row.requested_by === user.id) view.outgoing.push(pub);
    else view.incoming.push(pub);
  }
  // Online primeiro, depois em ordem alfabética.
  const rank = (u: PublicUser) => (u.status === "offline" ? 1 : 0);
  view.friends.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
  return view;
};

/** Pede amizade por "Nome#1234". Se o outro já tinha pedido, vira amizade. */
export const requestFriend = async (user: User, rawHandle: string) => {
  const match = /^(.+)#(\d{1,4})$/.exec(String(rawHandle ?? "").trim());
  if (!match) throw new HttpError(400, "Use o formato Nome#1234.");
  const db = await getDb();
  const [target] = await db.query<{ id: string }>(
    `select id from users where kind = 'account' and lower(name) = lower($1) and tag = $2`,
    [match[1].trim(), Number(match[2])],
  );
  if (!target) throw new HttpError(404, "Ninguém com esse Nome#1234.");
  if (target.id === user.id) throw new HttpError(400, "Esse é você.");

  const [low, high] = pair(user.id, target.id);
  const [existing] = await db.query<{ status: string; requested_by: string }>(
    `select status, requested_by from friendships where user_low = $1 and user_high = $2`,
    [low, high],
  );
  if (existing?.status === "accepted") throw new HttpError(409, "Vocês já são amigos.");
  if (existing && existing.requested_by === user.id) throw new HttpError(409, "Pedido já enviado.");
  if (existing) {
    await db.query(`update friendships set status = 'accepted' where user_low = $1 and user_high = $2`, [low, high]);
  } else {
    await db.query(`insert into friendships (user_low, user_high, requested_by, status) values ($1, $2, $3, 'pending')`, [
      low,
      high,
      user.id,
    ]);
  }
  await publish(`user:${target.id}`, "friends_changed");
};

export const respondFriend = async (user: User, otherId: string, accept: boolean) => {
  const db = await getDb();
  const [low, high] = pair(user.id, otherId);
  const rows = accept
    ? await db.query(
        `update friendships set status = 'accepted' where user_low = $1 and user_high = $2 and status = 'pending' and requested_by <> $3 returning 1`,
        [low, high, user.id],
      )
    : await db.query(`delete from friendships where user_low = $1 and user_high = $2 and status = 'pending' returning 1`, [low, high]);
  if (rows.length === 0) throw new HttpError(404, "Pedido não encontrado.");
  await publish(`user:${otherId}`, "friends_changed");
};

export const removeFriend = async (user: User, otherId: string) => {
  const db = await getDb();
  const [low, high] = pair(user.id, otherId);
  await db.query(`delete from friendships where user_low = $1 and user_high = $2`, [low, high]);
  await publish(`user:${otherId}`, "friends_changed");
};

export const areFriends = async (a: string, b: string) => {
  const db = await getDb();
  const [low, high] = pair(a, b);
  const rows = await db.query(`select 1 from friendships where user_low = $1 and user_high = $2 and status = 'accepted'`, [low, high]);
  return rows.length > 0;
};
