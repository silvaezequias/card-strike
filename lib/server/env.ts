/* ═══════════════════════════════════════════════
   CONFIGURAÇÃO DO SERVIDOR
   Tudo vem de variáveis de ambiente (.env.local no
   computador, painel da Vercel em produção). Sem
   DATABASE_URL o banco é o PGlite local em .data/,
   que só serve para desenvolvimento.
   ═══════════════════════════════════════════════ */

const isProd =
  process.env.VERCEL_ENV === "production" ||
  process.env.NODE_ENV === "production";

export const env = {
  /**
   * Postgres do Supabase (string de conexão do pooler, modo transação). A
   * integração Supabase ↔ Vercel cria POSTGRES_URL sozinha, já pelo pooler.
   */
  databaseUrl: process.env.DATABASE_URL || process.env.POSTGRES_URL || "",
  /**
   * Segredo das sessões (cookie assinado). Obrigatório em produção; sem
   * AUTH_SECRET, usa o segredo JWT que a integração do Supabase cria.
   */
  authSecret:
    process.env.AUTH_SECRET ||
    process.env.SUPABASE_JWT_SECRET ||
    (isProd ? "" : "card-strike-dev-secret-troque-em-producao"),
  /** Endereço público do site, usado nos retornos do login. */
  appUrl: process.env.APP_URL ?? "",

  supabaseUrl:
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
  /** Chave pública (anon): basta para o Broadcast em canais públicos. */
  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",

  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  discordClientId: process.env.DISCORD_CLIENT_ID ?? "",
  discordClientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",

  steamAppId: process.env.STEAM_APP_ID ?? "",
  steamWebApiKey: process.env.STEAM_WEB_API_KEY ?? "",

  isProd,
};

/**
 * Tempo real pelo Supabase quando configurado; senão, canal local (só desenvolvimento).
 * Os avisos são só sinais ("mudou, busque de novo"): o estado de verdade sempre vem
 * da API, então a chave pública basta e um aviso falso não altera nada.
 */
export const useSupabaseRealtime = () =>
  !!env.supabaseUrl && !!(env.supabaseServiceKey || env.supabaseAnonKey);

export const realtimeKey = () => env.supabaseServiceKey || env.supabaseAnonKey;

/** O online só funciona com banco de verdade em produção. */
export const onlineAvailable = () =>
  !!env.authSecret && (!env.isProd || !!env.databaseUrl);

export const providers = () => ({
  google: !!env.googleClientId && !!env.googleClientSecret,
  discord: !!env.discordClientId && !!env.discordClientSecret,
  steam: !!env.steamAppId && !!env.steamWebApiKey,
});
