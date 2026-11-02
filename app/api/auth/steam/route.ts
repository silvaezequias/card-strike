import { createSession, sessionUserId } from "@/lib/server/session";
import { verifySteamTicket } from "@/lib/server/steam";
import { apiError, findUser, publicUser, upsertProviderAccount } from "@/lib/server/users";

/** Entra (ou liga a conta) pela Steam, a partir do ticket do app de desktop. */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const steam = await verifySteamTicket(String(body.ticket ?? ""));
    const currentId = await sessionUserId();
    const current = currentId ? await findUser(currentId) : null;
    const user = await upsertProviderAccount({
      provider: "steam",
      providerId: steam.steamId,
      name: steam.name,
      avatarUrl: steam.avatarUrl,
      linkTo: current?.kind === "account" ? current.id : null,
    });
    await createSession(user.id, "account");
    return Response.json({ user: publicUser(user) });
  } catch (error) {
    return apiError(error);
  }
}
