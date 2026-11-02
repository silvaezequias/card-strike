import { GameAction } from "@/game/game-actions";
import { playAction } from "@/lib/server/matches";
import { route } from "@/lib/server/route";
import { requireUser } from "@/lib/server/users";

/** Jogada do jogador da vez (o servidor confere e aplica). */
export const POST = route<{ id: string }>(async ({ params, body }) => ({
  match: await playAction(await requireUser(), params.id, body.action as GameAction),
}));
