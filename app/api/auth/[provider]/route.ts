import { isProvider, startLogin } from "@/lib/server/oauth";
import { apiError } from "@/lib/server/users";

/** Começa o login pelo Google ou Discord (redireciona para o provedor). */
export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  try {
    const { provider } = await params;
    if (!isProvider(provider)) return new Response("Provedor desconhecido.", { status: 404 });
    const url = new URL(request.url);
    const target = await startLogin(provider, url.origin, url.searchParams.get("next") ?? "/");
    return Response.redirect(target.toString(), 302);
  } catch (error) {
    return apiError(error);
  }
}
