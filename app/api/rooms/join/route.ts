import { joinRoomByCode } from "@/lib/server/matches";
import { route } from "@/lib/server/route";
import { requireUser } from "@/lib/server/users";

/** Entra numa sala pelo código. */
export const POST = route(async ({ body }) => ({ room: await joinRoomByCode(await requireUser(), String(body.code ?? "")) }));
