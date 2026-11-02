import { playFinishRoll } from "@/lib/server/matches";
import { route } from "@/lib/server/route";
import { requireUser } from "@/lib/server/users";

/** Fim da animação do sorteio: aplica o resultado. */
export const POST = route<{ id: string }>(async ({ params }) => ({ match: await playFinishRoll(await requireUser(), params.id) }));
