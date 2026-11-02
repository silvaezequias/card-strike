import { createRoom } from "@/lib/server/matches";
import { route } from "@/lib/server/route";
import { requireUser } from "@/lib/server/users";

/** Cria uma sala privada com código. */
export const POST = route(async ({ body }) => ({ room: await createRoom(await requireUser(), body.team === "faction" ? "faction" : "police") }));
