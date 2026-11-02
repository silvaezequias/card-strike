import { env, realtimeKey, useSupabaseRealtime } from "./env";

/* ═══════════════════════════════════════════════
   TEMPO REAL (servidor)
   O servidor publica eventos em canais; os clientes
   assinam. Canais:
     user:<id>   convites, amizades, partida encontrada
     room:<id>   mudanças na sala
     match:<id>  estado novo da partida
   Em produção vai pelo Broadcast do Supabase; no
   computador, por um barramento em memória lido via
   SSE (/api/realtime). Serverless não guarda conexão,
   por isso o servidor só publica, nunca escuta.
   ═══════════════════════════════════════════════ */

export type RealtimeEvent = {
  channel: string;
  event: string;
  payload: unknown;
};

type Listener = (event: RealtimeEvent) => void;
type Global = typeof globalThis & { __cardStrikeBus?: Set<Listener> };

/** Barramento local (um processo do `next dev`). */
export const localBus = () => {
  const g = globalThis as Global;
  g.__cardStrikeBus ??= new Set();
  return g.__cardStrikeBus;
};

export const publish = async (
  channel: string,
  event: string,
  payload: unknown = {},
) => {
  if (useSupabaseRealtime()) {
    try {
      await fetch(`${env.supabaseUrl}/realtime/v1/api/broadcast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: realtimeKey(),
          Authorization: `Bearer ${realtimeKey()}`,
        },
        body: JSON.stringify({
          messages: [{ topic: channel, event, payload }],
        }),
      });
    } catch (error) {
      // O estado fica salvo; quem perder o aviso recarrega pelo próximo pedido.
      console.error("realtime", error);
    }
    return;
  }
  localBus().forEach((listener) => listener({ channel, event, payload }));
};

export const publishMany = (
  channels: string[],
  event: string,
  payload: unknown = {},
) => Promise.all(channels.map((channel) => publish(channel, event, payload)));
