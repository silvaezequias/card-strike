import { env } from "@/lib/server/env";
import { createSession } from "@/lib/server/session";
import { apiError, cleanName, publicUser, upsertProviderAccount } from "@/lib/server/users";

/**
 * Só em desenvolvimento: cria/entra numa conta (com Nome#1234 e amigos) sem
 * Google, Discord ou Steam, para testar o online no computador. Em produção
 * esta rota não existe (404).
 */
export async function POST(request: Request) {
  if (env.isProd) return new Response("Não encontrado.", { status: 404 });
  try {
    const body = await request.json().catch(() => ({}));
    const name = cleanName(body.name);
    const user = await upsertProviderAccount({ provider: "google", providerId: `dev:${name.toLowerCase()}`, name });
    await createSession(user.id, "account");
    return Response.json({ user: publicUser(user) });
  } catch (error) {
    return apiError(error);
  }
}
