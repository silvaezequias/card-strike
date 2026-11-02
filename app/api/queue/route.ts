import { joinQueue, leaveQueue } from "@/lib/server/matches";
import { route } from "@/lib/server/route";
import { requireUser } from "@/lib/server/users";

/** Entra na fila pública (ou renova a presença nela). */
export const POST = route(async () => joinQueue(await requireUser()));

/** Sai da fila. */
export const DELETE = route(async () => {
  await leaveQueue(await requireUser());
});
