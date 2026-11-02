import { playTimeout } from "@/lib/server/matches";
import { route } from "@/lib/server/route";
import { requireUser } from "@/lib/server/users";

/** Cobra o tempo esgotado do turno (o servidor confere o prazo). */
export const POST = route<{ id: string }>(async ({ params }) => ({ match: await playTimeout(await requireUser(), params.id) }));
