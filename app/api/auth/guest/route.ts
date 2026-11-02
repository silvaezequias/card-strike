import { onlineAvailable } from "@/lib/server/env";
import { createSession } from "@/lib/server/session";
import { HttpError, apiError, cleanName, createGuest, publicUser } from "@/lib/server/users";

/** Entra como convidado: só um nick, sem lista de amigos. */
export async function POST(request: Request) {
  try {
    if (!onlineAvailable()) throw new HttpError(503, "O modo online ainda não está configurado neste servidor.");
    const body = await request.json().catch(() => ({}));
    const user = await createGuest(cleanName(body.name));
    await createSession(user.id, "guest");
    return Response.json({ user: publicUser(user) });
  } catch (error) {
    return apiError(error);
  }
}
