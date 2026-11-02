import { getRoom, leaveRoom, updateRoom } from "@/lib/server/matches";
import { route } from "@/lib/server/route";
import { requireUser } from "@/lib/server/users";

type P = { id: string };

/** Estado da sala. */
export const GET = route<P>(async ({ params }) => ({
  room: await getRoom(await requireUser(), params.id),
}));

/** Dono muda o time dele (o convidado fica com o outro), o modo de jogo ou as regras. */
export const PATCH = route<P>(async ({ params, body }) => ({
  room: await updateRoom(await requireUser(), params.id, {
    team: body.team,
    mode: body.mode,
    rules: body.rules,
  }),
}));

/** Sai da sala (o dono saindo fecha a sala). */
export const DELETE = route<P>(async ({ params }) => {
  await leaveRoom(await requireUser(), params.id);
});
