import { listFriends, removeFriend, requestFriend } from "@/lib/server/social";
import { apiError, requireAccount } from "@/lib/server/users";

/** Amigos, pedidos recebidos e enviados. */
export async function GET() {
  try {
    return Response.json(await listFriends(await requireAccount()));
  } catch (error) {
    return apiError(error);
  }
}

/** Pede amizade por Nome#1234. */
export async function POST(request: Request) {
  try {
    const me = await requireAccount();
    const body = await request.json().catch(() => ({}));
    await requestFriend(me, body.handle);
    return Response.json(await listFriends(me));
  } catch (error) {
    return apiError(error);
  }
}

/** Desfaz a amizade. */
export async function DELETE(request: Request) {
  try {
    const me = await requireAccount();
    const body = await request.json().catch(() => ({}));
    await removeFriend(me, String(body.userId ?? ""));
    return Response.json(await listFriends(me));
  } catch (error) {
    return apiError(error);
  }
}
