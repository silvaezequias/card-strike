import { localBus, RealtimeEvent } from "@/lib/server/realtime";
import { sessionUserId } from "@/lib/server/session";

/* Canal local de tempo real (só desenvolvimento): SSE com os eventos do
   barramento em memória. Em produção os clientes assinam o Supabase. */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const userId = await sessionUserId();
  if (!userId) return new Response("Entre para continuar.", { status: 401 });

  const wanted = new URL(request.url).searchParams.get("channels")?.split(",").filter(Boolean) ?? [];
  // O canal pessoal só pode ser ouvido pelo próprio dono.
  const channels = new Set(wanted.filter((c) => !c.startsWith("user:") || c === `user:${userId}`));
  const encoder = new TextEncoder();

  let cleanup = () => {};
  const stream = new ReadableStream({
    start(controller) {
      const send = (text: string) => {
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          cleanup();
        }
      };
      const listener = (event: RealtimeEvent) => {
        if (channels.has(event.channel)) send(`data: ${JSON.stringify(event)}\n\n`);
      };
      const bus = localBus();
      bus.add(listener);
      const ping = setInterval(() => send(": ping\n\n"), 20_000);
      cleanup = () => {
        bus.delete(listener);
        clearInterval(ping);
      };
      request.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {
          // já fechado
        }
      });
      send(": conectado\n\n");
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" },
  });
}
