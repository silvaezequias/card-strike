/* Ponte segura entre a página do jogo e a Steam (window.cardStrikeSteam).
   Mesmo formato do tipo SteamBridge em lib/platform/steam.ts. */

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("cardStrikeSteam", {
  getAuthTicket: () => ipcRenderer.invoke("steam:ticket"),
  getFriends: () => ipcRenderer.invoke("steam:friends"),
  inviteToRoom: (steamId, roomCode) => ipcRenderer.invoke("steam:invite", steamId, roomCode),
  setRoomPresence: (roomCode) => ipcRenderer.send("steam:presence", roomCode),
  onJoinRequested: (handler) => {
    const listener = (_event, code) => handler(code);
    ipcRenderer.on("steam:join", listener);
    return () => ipcRenderer.removeListener("steam:join", listener);
  },
});
