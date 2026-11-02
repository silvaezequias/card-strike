/* ═══════════════════════════════════════════════
   CARD STRIKE · APP DA STEAM (processo principal)
   Abre o jogo hospedado (Vercel) numa janela e liga
   o cliente da Steam pelo steamworks.js. A página
   fala com a Steam só pela ponte do preload.js
   (window.cardStrikeSteam).

   Convites: o código da sala vai na Rich Presence
   "connect" (+connect CODIGO). Quando um amigo clica
   em "Entrar no jogo" (ou aceita o convite), a Steam
   avisa aqui (ou abre o jogo com +connect) e o código
   segue para a página, que entra na sala.
   ═══════════════════════════════════════════════ */

const path = require("node:path");
const { app, BrowserWindow, ipcMain, shell } = require("electron");

/** Endereço do jogo. Em produção, o domínio da Vercel. */
const GAME_URL = process.env.CARD_STRIKE_URL || "https://card-strike.vercel.app";
/** 480 = Spacewar (app de teste da Steam). Troque pelo App ID do Card Strike. */
const APP_ID = Number(process.env.STEAM_APP_ID || 480);

let steam = null;
let win = null;
/** Código pedido antes da janela carregar (jogo aberto por um convite). */
let pendingJoin = null;

const connectArg = (argv) => {
  const i = argv.indexOf("+connect");
  return i >= 0 ? argv[i + 1] : null;
};

const sendJoin = (code) => {
  if (!code) return;
  if (win && !win.webContents.isLoading()) win.webContents.send("steam:join", String(code).toUpperCase());
  else pendingJoin = code;
};

const initSteam = () => {
  try {
    const steamworks = require("steamworks.js");
    steam = steamworks.init(APP_ID);
    // Sobreposição da Steam (Shift+Tab) dentro da janela do Electron.
    steamworks.electronEnableSteamOverlay?.();
    const { SteamCallback } = steamworks;
    steam.callback?.register?.(SteamCallback.GameRichPresenceJoinRequested, (event) => sendJoin(connectArg(String(event.connect ?? "").split(" "))));
    return true;
  } catch (error) {
    console.warn("[steam] cliente da Steam indisponível:", error?.message ?? error);
    steam = null;
    return false;
  }
};

const friendsOf = () => {
  // A lista de amigos depende da versão do steamworks.js; sem ela, os convites
  // continuam pela sobreposição da Steam (inviteToRoom sem steamId).
  const list = steam?.friends?.getFriends?.() ?? [];
  return list.map((f) => ({
    steamId: String(f.steamId?.steamId64 ?? f.steamId ?? f.id),
    name: f.name ?? f.personaName ?? "Amigo",
    avatarUrl: f.avatarUrl ?? null,
    state: String(f.state ?? f.personaState ?? "offline").toLowerCase(),
    inGame: Number(f.gameId ?? f.playingAppId ?? 0) === APP_ID,
  }));
};

const registerIpc = () => {
  ipcMain.handle("steam:available", () => !!steam);

  ipcMain.handle("steam:ticket", async () => {
    if (!steam) throw new Error("Steam indisponível.");
    const ticket = await steam.auth.getSessionTicket();
    return Buffer.from(ticket.getBytes()).toString("hex");
  });

  ipcMain.handle("steam:friends", () => (steam ? friendsOf() : []));

  ipcMain.handle("steam:invite", (_event, steamId, code) => {
    if (!steam) return;
    const connect = `+connect ${code}`;
    steam.localplayer.setRichPresence("connect", connect);
    // Convite direto quando a versão expõe; senão abre o diálogo de convite da Steam.
    if (steamId && steam.friends?.inviteUserToGame) steam.friends.inviteUserToGame(BigInt(steamId), connect);
    else steam.overlay?.activateInviteDialogConnectString?.(connect);
  });

  ipcMain.on("steam:presence", (_event, code) => {
    if (!steam) return;
    steam.localplayer.setRichPresence("connect", code ? `+connect ${code}` : null);
    steam.localplayer.setRichPresence("status", code ? "Na sala, esperando oponente" : "No menu");
  });
};

const createWindow = () => {
  win = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1100,
    minHeight: 640,
    backgroundColor: "#050409",
    autoHideMenuBar: true,
    title: "Card Strike",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: true,
    },
  });
  win.loadURL(GAME_URL);
  win.webContents.on("did-finish-load", () => {
    if (pendingJoin) {
      const code = pendingJoin;
      pendingJoin = null;
      sendJoin(code);
    }
  });
  // Links externos (login do Google/Discord abrem dentro; o resto no navegador).
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
};

// Uma instância só: um segundo "+connect" vai para a janela aberta.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    sendJoin(connectArg(argv));
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    initSteam();
    registerIpc();
    pendingJoin = connectArg(process.argv);
    createWindow();
  });

  app.on("window-all-closed", () => app.quit());
}
