import { finishLogin, isProvider } from "@/lib/server/oauth";
import { createSession, sessionUserId } from "@/lib/server/session";
import { findUser, upsertProviderAccount } from "@/lib/server/users";

/**
 * Retorno do Google/Discord. Quem já tem conta liga o novo provedor a ela;
 * quem estava como convidado (ou sem sessão) entra numa conta.
 */
export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const url = new URL(request.url);
  if (!isProvider(provider)) return new Response("Provedor desconhecido.", { status: 404 });
  try {
    const profile = await finishLogin(provider, url.origin, url);
    const currentId = await sessionUserId();
    const current = currentId ? await findUser(currentId) : null;
    const user = await upsertProviderAccount({
      provider,
      providerId: profile.id,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      linkTo: current?.kind === "account" ? current.id : null,
    });
    await createSession(user.id, "account");
    return Response.redirect(new URL(profile.next, url.origin).toString(), 302);
  } catch (error) {
    console.error(error);
    return Response.redirect(new URL("/?login=erro", url.origin).toString(), 302);
  }
}
