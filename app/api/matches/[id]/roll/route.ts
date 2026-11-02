import { playRoll } from "@/lib/server/matches";
import { route } from "@/lib/server/route";
import { requireUser } from "@/lib/server/users";

/** Lança o dado ou gira a roleta (o sorteio é feito no servidor). */
export const POST = route<{ id: string }>(async ({ params }) => ({ match: await playRoll(await requireUser(), params.id) }));
