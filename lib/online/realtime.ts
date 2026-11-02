"use client";

import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════
   TEMPO REAL (cliente)
   Assina canais e chama `onEvent` a cada aviso do
   servidor. Com NEXT_PUBLIC_SUPABASE_URL usa o
   Broadcast do Supabase; senão, o SSE local.
   ═══════════════════════════════════════════════ */

export type ClientEvent = { channel: string; event: string; payload: unknown };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

let supabase: SupabaseClient | null = null;
const getSupabase = async () => {
  if (!supabase) {
    const { createClient } = await import("@supabase/supabase-js");
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
  }
  return supabase;
};

/** Assina os canais; devolve a função que cancela. */
export const subscribe = (channels: string[], onEvent: (event: ClientEvent) => void) => {
  if (channels.length === 0) return () => {};

  if (SUPABASE_URL && SUPABASE_KEY) {
    let closed = false;
    const subs: RealtimeChannel[] = [];
    getSupabase().then((client) => {
      if (closed) return;
      for (const channel of channels) {
        const sub = client
          .channel(channel)
          .on("broadcast", { event: "*" }, (message) => onEvent({ channel, event: message.event, payload: message.payload }))
          .subscribe();
        subs.push(sub);
      }
    });
    return () => {
      closed = true;
      subs.forEach((sub) => sub.unsubscribe());
    };
  }

  const source = new EventSource(`/api/realtime?channels=${encodeURIComponent(channels.join(","))}`);
  source.onmessage = (message) => {
    try {
      onEvent(JSON.parse(message.data));
    } catch {
      // mensagem quebrada: ignora
    }
  };
  return () => source.close();
};
