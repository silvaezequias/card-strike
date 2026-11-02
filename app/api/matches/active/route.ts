import { activeMatchId } from "@/lib/server/matches";
import { route } from "@/lib/server/route";
import { requireUser } from "@/lib/server/users";

/** Partida em andamento do jogador (para voltar a ela). */
export const GET = route(async () => ({ matchId: await activeMatchId(await requireUser()) }));
