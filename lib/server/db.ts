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
  for (const [i, sql] of MIGRATIONS.entries()) {
    await db.tx(async (tx) => {
      // Trava: duas funções serverless subindo juntas não aplicam a mesma migração.
      await tx.query(`select pg_advisory_xact_lock(4242)`);
      const done = await tx.query(`select 1 from _cs_migrations where id = $1`, [i]);
      if (done.length) return;
      for (const statement of sql.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean)) {
        await tx.query(statement);
      }
      await tx.query(`insert into _cs_migrations (id) values ($1)`, [i]);
    });
  }
};

/** Conexão única por processo, com as migrações aplicadas. */
export const getDb = async (): Promise<Db> => {
  const g = globalThis as Global & { __cardStrikeMigrated?: number };
  const db = await connect(g);
  // No desenvolvimento a conexão sobrevive às edições: migrações novas rodam aqui.
  if ((g.__cardStrikeMigrated ?? 0) < MIGRATIONS.length) {
    await migrate(db);
    g.__cardStrikeMigrated = MIGRATIONS.length;
  }
  return db;
};

const connect = (g: Global): Promise<Db> => {
  g.__cardStrikeDb ??= (async () => {
    const db = env.databaseUrl ? await connectPostgres() : await connectPglite();
    return db;
  })().catch((error) => {
    // Falhou ao conectar: a próxima chamada tenta de novo.
    g.__cardStrikeDb = undefined;
    throw error;
  });
  return g.__cardStrikeDb;
};
