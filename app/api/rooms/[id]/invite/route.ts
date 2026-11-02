import { inviteFriend } from "@/lib/server/matches";
import { route } from "@/lib/server/route";
import { requireUser } from "@/lib/server/users";

/** Convida um amigo para a sala. */
export const POST = route<{ id: string }>(async ({ params, body }) => {
  await inviteFriend(await requireUser(), params.id, String(body.friendId ?? ""));
});
