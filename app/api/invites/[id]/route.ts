import { respondInvite } from "@/lib/server/matches";
import { route } from "@/lib/server/route";
import { requireUser } from "@/lib/server/users";

/** Aceita (entra na sala) ou recusa um convite. */
export const POST = route<{ id: string }>(async ({ params, body }) => ({
  room: await respondInvite(await requireUser(), params.id, !!body.accept),
}));
