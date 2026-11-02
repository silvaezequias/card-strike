import { matchHeartbeat } from "@/lib/server/matches";
import { route } from "@/lib/server/route";
import { requireUser } from "@/lib/server/users";

/** Sinal de vida na partida; diz há quanto tempo o oponente sumiu. */
export const POST = route<{ id: string }>(async ({ params }) => matchHeartbeat(await requireUser(), params.id));
