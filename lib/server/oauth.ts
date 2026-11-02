import {
  Discord,
  Google,
  decodeIdToken,
  generateCodeVerifier,
  generateState,
} from "arctic";
import { cookies } from "next/headers";
import { env } from "./env";
import { HttpError } from "./users";

/* ═══════════════════════════════════════════════
   LOGIN EXTERNO (Google e Discord)
   Fluxo OAuth com PKCE. O `state` e o verificador
   ficam em cookies curtos até o retorno. Cada
   provedor só liga quando as chaves estão no .env.
   ═══════════════════════════════════════════════ */

export type OAuthProvider = "google" | "discord";

const STATE_COOKIE = "cs_oauth_state";
const VERIFIER_COOKIE = "cs_oauth_verifier";
const NEXT_COOKIE = "cs_oauth_next";

const callbackUrl = (origin: string, provider: OAuthProvider) =>
  `${env.appUrl || origin}/api/auth/${provider}/callback`;

const client = (provider: OAuthProvider, origin: string) => {
  if (provider === "google") {
    if (!env.googleClientId)
      throw new HttpError(503, "Login pelo Google ainda não configurado.");
    return new Google(
      env.googleClientId,
      env.googleClientSecret,
      callbackUrl(origin, provider),
    );
  }
  if (!env.discordClientId)
    throw new HttpError(503, "Login pelo Discord ainda não configurado.");
  return new Discord(
    env.discordClientId,
    env.discordClientSecret,
    callbackUrl(origin, provider),
  );
};

const SCOPES: Record<OAuthProvider, string[]> = {
  google: ["openid", "profile"],
  discord: ["identify"],
};

export const isProvider = (value: string): value is OAuthProvider =>
  value === "google" || value === "discord";

/** Endereço do provedor para onde o jogador vai fazer login. */
export const startLogin = async (
  provider: OAuthProvider,
  origin: string,
  next = "/",
) => {
  const state = generateState();
  const verifier = generateCodeVerifier();
  const url = client(provider, origin).createAuthorizationURL(
    state,
    verifier,
    SCOPES[provider],
  );
  const jar = await cookies();
  const opts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: env.isProd,
    path: "/",
    maxAge: 600,
  };
  jar.set(STATE_COOKIE, state, opts);
  jar.set(VERIFIER_COOKIE, verifier, opts);
  jar.set(NEXT_COOKIE, next.startsWith("/") ? next : "/", opts);
  return url;
};

export type ProviderProfile = {
  id: string;
  name: string;
  avatarUrl: string | null;
  next: string;
};

/** Confere o retorno do provedor e devolve quem entrou. */
export const finishLogin = async (
  provider: OAuthProvider,
  origin: string,
  url: URL,
): Promise<ProviderProfile> => {
  const jar = await cookies();
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const saved = jar.get(STATE_COOKIE)?.value;
  const verifier = jar.get(VERIFIER_COOKIE)?.value;
  const next = jar.get(NEXT_COOKIE)?.value ?? "/";
  jar.delete(STATE_COOKIE);
  jar.delete(VERIFIER_COOKIE);
  jar.delete(NEXT_COOKIE);
  if (!state || !code || !saved || !verifier || state !== saved)
    throw new HttpError(400, "Login expirado. Tente de novo.");

  const tokens = await client(provider, origin).validateAuthorizationCode(
    code,
    verifier,
  );

  if (provider === "google") {
    const claims = decodeIdToken(tokens.idToken()) as {
      sub: string;
      name?: string;
      given_name?: string;
      picture?: string;
    };
    return {
      id: claims.sub,
      name: claims.given_name || claims.name || "Operador",
      avatarUrl: claims.picture ?? null,
      next,
    };
  }

  const response = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${tokens.accessToken()}` },
  });
  if (!response.ok)
    throw new HttpError(502, "O Discord não respondeu. Tente de novo.");
  const me = (await response.json()) as {
    id: string;
    username: string;
    global_name?: string;
    avatar?: string;
  };
  return {
    id: me.id,
    name: me.global_name || me.username,
    avatarUrl: me.avatar
      ? `https://cdn.discordapp.com/avatars/${me.id}/${me.avatar}.png?size=128`
      : null,
    next,
  };
};
