import { getMatch } from "@/lib/server/matches";
import { route } from "@/lib/server/route";
import { requireUser } from "@/lib/server/users";

/** Estado atual da partida, visto pelo jogador. */
export const GET = route<{ id: string }>(async ({ params }) => ({ match: await getMatch(await requireUser(), params.id) }));
