# Card Strike para a Steam (desktop)

Janela Electron que abre o jogo hospedado e liga o cliente da Steam pelo [steamworks.js](https://github.com/ceifa/steamworks.js).

## O que a Steam faz no jogo

- **Login**: o botão "Entrar com a Steam" (só aparece dentro deste app) pede um ticket de sessão à Steam e o servidor confere com a Web API (`/api/auth/steam`). A conta recebe o nome e a foto da Steam.
- **Amigos da Steam**: aparecem na lista de amigos do jogo, numa seção própria.
- **Convites**: com uma sala aberta, o código vai na Rich Presence `connect`. O amigo pode clicar em "Entrar no jogo" na lista de amigos da Steam ou aceitar o convite, e o jogo entra direto na sala (também quando o jogo estava fechado: a Steam abre com `+connect CODIGO`).

A página fala com a Steam só pela ponte `window.cardStrikeSteam` (`preload.js`), com o formato de `lib/platform/steam.ts`. No navegador a ponte não existe e esses recursos ficam escondidos.

## Rodar

Precisa da Steam aberta e logada.

```bash
cd desktop
npm install
npm run dev
```

`npm run dev` abre `http://localhost:3000` (rode o `npm run dev` do site antes). `npm start` abre o endereço de `CARD_STRIKE_URL` (padrão: o domínio da Vercel em `main.js`).

`steam_appid.txt` está com `480` (Spacewar, o app de teste da Steam). Quando tiver o App ID do Card Strike, troque nele e em `STEAM_APP_ID`, e cadastre `STEAM_APP_ID` e `STEAM_WEB_API_KEY` (chave de editor) na Vercel.

## Antes de publicar

- Empacotar com electron-builder ou electron-forge, incluindo os binários do steamworks.js (`steam_api64.dll` etc.) e o `steam_appid.txt` só para testes.
- Rich Presence: cadastrar as chaves de exibição (`status`) em Steamworks > Rich Presence.
- A lista de amigos e o convite direto dependem da versão do steamworks.js. Sem eles, o convite abre o diálogo de convite da sobreposição da Steam (`main.js` já trata os dois casos).
