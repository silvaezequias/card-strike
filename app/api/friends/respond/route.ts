import { listFriends, respondFriend } from "@/lib/server/social";
import { apiError, requireAccount } from "@/lib/server/users";

/** Aceita ou recusa um pedido de amizade. */
export async function POST(request: Request) {
  try {
    const me = await requireAccount();
    const body = await request.json().catch(() => ({}));
    await respondFriend(me, String(body.userId ?? ""), !!body.accept);
    return Response.json(await listFriends(me));
  } catch (error) {
    return apiError(error);
  }
}
