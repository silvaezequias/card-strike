import { env } from "./env";
import { MIGRATIONS } from "./migrations";

/* ═══════════════════════════════════════════════
   BANCO
   Uma interface mínima (query e transação) com dois
   motores: Postgres de verdade (Supabase, em produção)
   e PGlite (Postgres em WebAssembly, no computador).
   O SQL é o mesmo nos dois.
   ═══════════════════════════════════════════════ */

export type Row = Record<string, unknown>;

export type Db = {
  query: <T extends Row = Row>(sql: string, params?: unknown[]) => Promise<T[]>;
  tx: <R>(fn: (db: Pick<Db, "query">) => Promise<R>) => Promise<R>;
};

type Global = typeof globalThis & { __cardStrikeDb?: Promise<Db> };

const connectPostgres = async (): Promise<Db> => {
  const postgres = (await import("postgres")).default;
  // prepare: false é exigido pelo pooler do Supabase em modo transação.
  const sql = postgres(env.databaseUrl, { prepare: false, max: 3, idle_timeout: 20 });
  const query = async <T extends Row>(text: string, params: unknown[] = []) =>
    (await sql.unsafe(text, params as never[])) as unknown as T[];
  return {
    query,
    tx: (fn) =>
      sql.begin(async (tx) =>
        fn({ query: async <T extends Row>(text: string, params: unknown[] = []) => (await tx.unsafe(text, params as never[])) as unknown as T[] }),
      ) as never,
  };
};

const connectPglite = async (): Promise<Db> => {
  const { PGlite } = await import("@electric-sql/pglite");
  const { mkdir } = await import("node:fs/promises");
  await mkdir("./.data", { recursive: true });
  const pg = new PGlite("./.data/pglite");
  await pg.waitReady;
  const query = async <T extends Row>(text: string, params: unknown[] = []) => (await pg.query<T>(text, params)).rows;
  return {
    query,
    tx: (fn) =>
      pg.transaction(async (tx) =>
        fn({ query: async <T extends Row>(text: string, params: unknown[] = []) => (await tx.query<T>(text, params)).rows }),
      ),
  };
};

const migrate = async (db: Db) => {
  await db.query(`create table if not exists _cs_migrations (id int primary key, applied_at timestamptz not null default now())`);
  const done = new Set((await db.query<{ id: number }>(`select id from _cs_migrations`)).map((r) => Number(r.id)));
  for (const [i, sql] of MIGRATIONS.entries()) {
    if (done.has(i)) continue;
    await db.tx(async (tx) => {
      for (const statement of sql.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean)) {
        await tx.query(statement);
      }
      await tx.query(`insert into _cs_migrations (id) values ($1)`, [i]);
    });
  }
};

/** Conexão única por processo, com as migrações aplicadas. */
export const getDb = (): Promise<Db> => {
  const g = globalThis as Global;
  g.__cardStrikeDb ??= (async () => {
    const db = env.databaseUrl ? await connectPostgres() : await connectPglite();
    await migrate(db);
    return db;
  })().catch((error) => {
    // Falhou ao conectar: a próxima chamada tenta de novo.
    g.__cardStrikeDb = undefined;
    throw error;
  });
  return g.__cardStrikeDb;
};
