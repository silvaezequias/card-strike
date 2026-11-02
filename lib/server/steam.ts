import { env } from "./env";
import { HttpError } from "./users";

/* ═══════════════════════════════════════════════
   STEAM (servidor)
   No app da Steam (Electron + steamworks.js) o jogo
   pede um ticket de sessão ao cliente Steam e manda
   para cá; o servidor confere com a Web API da Steam
   e recebe o SteamID verdadeiro. Precisa de
   STEAM_APP_ID e STEAM_WEB_API_KEY (chave de editor).
   ═══════════════════════════════════════════════ */

const API = "https://partner.steam-api.com";

export const verifySteamTicket = async (ticketHex: string) => {
  if (!env.steamAppId || !env.steamWebApiKey) throw new HttpError(503, "Login pela Steam ainda não configurado.");
  if (!/^[0-9a-fA-F]{20,4096}$/.test(ticketHex)) throw new HttpError(400, "Ticket da Steam inválido.");

  const auth = new URL(`${API}/ISteamUserAuth/AuthenticateUserTicket/v1/`);
  auth.searchParams.set("key", env.steamWebApiKey);
  auth.searchParams.set("appid", env.steamAppId);
  auth.searchParams.set("ticket", ticketHex);
  const result = (await (await fetch(auth)).json()) as {
    response?: { params?: { result: string; steamid: string; vacbanned?: boolean }; error?: { errordesc: string } };
  };
  const params = result.response?.params;
  if (!params || params.result !== "OK") throw new HttpError(401, "A Steam não confirmou a sessão.");

  const summary = new URL(`${API}/ISteamUser/GetPlayerSummaries/v2/`);
  summary.searchParams.set("key", env.steamWebApiKey);
  summary.searchParams.set("steamids", params.steamid);
  const players = (await (await fetch(summary)).json()) as {
    response?: { players?: { personaname: string; avatarfull?: string }[] };
  };
  const player = players.response?.players?.[0];
  return { steamId: params.steamid, name: player?.personaname ?? "Operador", avatarUrl: player?.avatarfull ?? null };
};
