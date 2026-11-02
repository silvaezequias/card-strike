import { getRoom, leaveRoom, setRoomTeam } from "@/lib/server/matches";
import { route } from "@/lib/server/route";
import { requireUser } from "@/lib/server/users";

type P = { id: string };

/** Estado da sala. */
export const GET = route<P>(async ({ params }) => ({ room: await getRoom(await requireUser(), params.id) }));

/** Dono troca o time dele (o convidado fica com o outro). */
export const PATCH = route<P>(async ({ params, body }) => ({
  room: await setRoomTeam(await requireUser(), params.id, body.team === "faction" ? "faction" : "police"),
}));

/** Sai da sala (o dono saindo fecha a sala). */
export const DELETE = route<P>(async ({ params }) => {
  await leaveRoom(await requireUser(), params.id);
});
