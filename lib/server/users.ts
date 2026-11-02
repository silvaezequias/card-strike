import { Db, getDb } from "./db";
import { sessionUserId } from "./session";

/* ═══════════════════════════════════════════════
   USUÁRIOS
   Convidado: só um nick, para jogar sem cadastro.
   Conta: Nome#1234, com amigos; entra por Google,
   Discord ou Steam (um usuário pode ter os três).
   ═══════════════════════════════════════════════ */

export type UserKind = "guest" | "account";
export type Provider = "google" | "discord" | "steam";

export type User = {
  id: string;
  kind: UserKind;
  name: string;
  tag: number | null;
  avatar_url: string | null;
  status: string;
  last_seen: string;
  steam_id: string | null;
};

/** Visto há menos disso: online. */
export const ONLINE_WINDOW_MS = 75_000;

const USER_COLUMNS =
  "id, kind, name, tag, avatar_url, status, last_seen, steam_id";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Nome limpo: 3 a 16 letras, números, espaço, _ ou -. */
export const cleanName = (raw: unknown) => {
  const name = String(raw ?? "")
    .normalize("NFC")
    .replace(/[^\p{L}\p{N} _-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 16);
  if (name.length < 3)
    throw new HttpError(400, "O nome precisa ter de 3 a 16 caracteres.");
  return name;
};

export const handle = (user: Pick<User, "name" | "tag">) =>
  user.tag == null
    ? user.name
    : `${user.name}#${String(user.tag).padStart(4, "0")}`;

/** Visão pública de um usuário (o que os outros jogadores veem). */
export const publicUser = (user: User) => {
  const online =
    Date.now() - new Date(user.last_seen).getTime() < ONLINE_WINDOW_MS;
  return {
    id: user.id,
    kind: user.kind,
    name: user.name,
    tag: user.tag,
    handle: handle(user),
    avatarUrl: user.avatar_url,
    status: online ? user.status : "offline",
    /** Conta ligada à Steam (só o fato; o SteamID não sai do servidor). */
    steam: !!user.steam_id,
  };
};

export type PublicUser = ReturnType<typeof publicUser>;

export const findUser = async (id: string, db?: Pick<Db, "query">) => {
  const conn = db ?? (await getDb());
  const [user] = await conn.query<User>(
    `select ${USER_COLUMNS} from users where id = $1`,
    [id],
  );
  return user ?? null;
};

/** Usuário da sessão; erro 401 se não houver. */
export const requireUser = async () => {
  const id = await sessionUserId();
  const user = id ? await findUser(id) : null;
  if (!user) throw new HttpError(401, "Entre para continuar.");
  return user;
};

export const requireAccount = async () => {
  const user = await requireUser();
  if (user.kind !== "account")
    throw new HttpError(403, "Crie uma conta para ter lista de amigos.");
  return user;
};

export const createGuest = async (name: string) => {
  const db = await getDb();
  const [user] = await db.query<User>(
    `insert into users (kind, name, status) values ('guest', $1, 'online') returning ${USER_COLUMNS}`,
    [name],
  );
  return user;
};

/** Número livre para Nome#1234 (tenta alguns sorteios). */
const freeTag = async (db: Pick<Db, "query">, name: string) => {
  for (let i = 0; i < 20; i++) {
    const tag = 1 + Math.floor(Math.random() * 9999);
    const taken = await db.query(
      `select 1 from users where kind = 'account' and lower(name) = lower($1) and tag = $2`,
      [name, tag],
    );
    if (taken.length === 0) return tag;
  }
  throw new HttpError(409, "Esse nome está muito disputado. Tente outro.");
};

/**
 * Conta pelo login externo: encontra pelo id do provedor ou cria uma nova.
 * Com `linkTo`, liga o provedor a uma conta já existente.
 */
export const upsertProviderAccount = async ({
  provider,
  providerId,
  name,
  avatarUrl,
  linkTo,
}: {
  provider: Provider;
  providerId: string;
  name: string;
  avatarUrl?: string | null;
  linkTo?: string | null;
}) => {
  const db = await getDb();
  const column = `${provider}_id`;
  return db.tx(async (tx) => {
    const [existing] = await tx.query<User>(
      `select ${USER_COLUMNS} from users where ${column} = $1`,
      [providerId],
    );
    if (existing) return existing;

    if (linkTo) {
      const [linked] = await tx.query<User>(
        `update users set ${column} = $2, avatar_url = coalesce(avatar_url, $3) where id = $1 and kind = 'account' returning ${USER_COLUMNS}`,
        [linkTo, providerId, avatarUrl ?? null],
      );
      if (linked) return linked;
    }

    let clean: string;
    try {
      clean = cleanName(name);
    } catch {
      clean = "Operador";
    }
    const tag = await freeTag(tx, clean);
    const [created] = await tx.query<User>(
      `insert into users (kind, name, tag, avatar_url, ${column}, status) values ('account', $1, $2, $3, $4, 'online') returning ${USER_COLUMNS}`,
      [clean, tag, avatarUrl ?? null, providerId],
    );
    return created;
  });
};

export const renameAccount = async (userId: string, rawName: string) => {
  const name = cleanName(rawName);
  const db = await getDb();
  return db.tx(async (tx) => {
    const tag = await freeTag(tx, name);
    const [user] = await tx.query<User>(
      `update users set name = $2, tag = $3 where id = $1 returning ${USER_COLUMNS}`,
      [userId, name, tag],
    );
    return user;
  });
};

/** Responde erros conhecidos com o status certo nas rotas da API. */
export const apiError = (error: unknown) => {
  if (error instanceof HttpError)
    return Response.json({ error: error.message }, { status: error.status });
  console.error(error);
  return Response.json({ error: "Erro no servidor." }, { status: 500 });
};
