import { startRoom } from "@/lib/server/matches";
import { route } from "@/lib/server/route";
import { requireUser } from "@/lib/server/users";

/** Dono começa a partida (precisa do outro jogador na sala). */
export const POST = route<{ id: string }>(async ({ params }) => ({ matchId: await startRoom(await requireUser(), params.id) }));
