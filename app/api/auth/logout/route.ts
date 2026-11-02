import { getDb } from "@/lib/server/db";
import { clearSession, sessionUserId } from "@/lib/server/session";

/** Sai da conta: aparece offline para os amigos na hora. */
export async function POST() {
  const id = await sessionUserId();
  if (id) {
    const db = await getDb();
    await db.query(`update users set status = 'offline', last_seen = now() - interval '1 hour' where id = $1`, [id]);
  }
  await clearSession();
  return Response.json({ ok: true });
}
