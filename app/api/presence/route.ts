import { heartbeat } from "@/lib/server/social";
import { apiError, requireUser } from "@/lib/server/users";

/** Aviso periódico do cliente: online, ausente ou em partida. */
export async function POST(request: Request) {
  try {
    const me = await requireUser();
    const body = await request.json().catch(() => ({}));
    await heartbeat(me, String(body.status ?? "online"));
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
