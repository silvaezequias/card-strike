import { leaveMatch } from "@/lib/server/matches";
import { route } from "@/lib/server/route";
import { requireUser } from "@/lib/server/users";

/** Sai da partida (derrota por W.O.). */
export const POST = route<{ id: string }>(async ({ params }) => {
  await leaveMatch(await requireUser(), params.id);
});
