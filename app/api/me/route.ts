import { onlineAvailable, providers } from "@/lib/server/env";
import { sessionUserId } from "@/lib/server/session";
import { apiError, findUser, publicUser, renameAccount, requireAccount } from "@/lib/server/users";

/** Quem está logado e quais logins este servidor oferece. */
export async function GET() {
  try {
    const available = onlineAvailable();
    const id = available ? await sessionUserId() : null;
    const user = id ? await findUser(id) : null;
    return Response.json({
      online: available,
      providers: providers(),
      user: user ? publicUser(user) : null,
    });
  } catch (error) {
    return apiError(error);
  }
}

/** Troca o nome da conta (ganha um novo #número). */
export async function PATCH(request: Request) {
  try {
    const me = await requireAccount();
    const body = await request.json().catch(() => ({}));
    const user = await renameAccount(me.id, body.name);
    return Response.json({ user: publicUser(user) });
  } catch (error) {
    return apiError(error);
  }
}
