import { listInvites } from "@/lib/server/matches";
import { route } from "@/lib/server/route";
import { requireUser } from "@/lib/server/users";

/** Convites recebidos e ainda válidos. */
export const GET = route(async () => ({ invites: await listInvites(await requireUser()) }));
