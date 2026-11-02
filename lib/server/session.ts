import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "./env";

/* ═══════════════════════════════════════════════
   SESSÃO
   Cookie httpOnly com um JWT assinado (HS256) que
   guarda só o id do usuário. Convidados ficam 30
   dias; contas, 180.
   ═══════════════════════════════════════════════ */

export const SESSION_COOKIE = "cs_session";

const key = () => new TextEncoder().encode(env.authSecret);

export const createSession = async (
  userId: string,
  kind: "guest" | "account",
) => {
  const days = kind === "guest" ? 30 : 180;
  const token = await new SignJWT({ kind })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(key());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProd,
    path: "/",
    maxAge: days * 24 * 60 * 60,
  });
};

export const clearSession = async () =>
  (await cookies()).delete(SESSION_COOKIE);

/** Id do usuário da sessão, ou null. */
export const sessionUserId = async (): Promise<string | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key());
    return payload.sub ?? null;
  } catch {
    return null;
  }
};
