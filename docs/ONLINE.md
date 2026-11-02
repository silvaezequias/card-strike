# Card Strike online

Como o multiplayer funciona e o que configurar para colocar no ar.

## Arquitetura (pensada para a Vercel gratuita)

- **Servidor = rotas da API do Next** (`app/api/**`), funções serverless sem estado. Tudo que importa fica no Postgres do Supabase.
- **Partida no servidor**: o mesmo `gameReducer` do jogo local roda no servidor (`lib/server/match-engine.ts`). O cliente só manda a jogada; dado, roleta e compra de cartas são sorteados no servidor. Cada jogada é uma transação com `select ... for update`, então dois cliques ao mesmo tempo não quebram nada.
- **Relógio = prazo**: em vez de um timer rodando no servidor, cada turno tem um `deadline`. Quando passa, qualquer um dos jogadores cobra (`/timeout`) e o servidor aplica a mesma regra de tempo esgotado do modo local.
- **Tempo real**: a Vercel não segura WebSocket, então o servidor só *publica* um aviso no Supabase Realtime (Broadcast) e os navegadores escutam. O aviso só diz "mudou, busque de novo"; o estado sempre vem da API. Por isso a chave pública (anon) basta e um aviso falso não muda nada. Sem Supabase (no desenvolvimento) há um canal local por SSE em `/api/realtime`. Se o tempo real falhar, o cliente ainda revisa a partida a cada 6 s.
- **Ausência**: cada jogador manda um sinal de vida a cada 10 s. Sumiu por 60 s → o outro ganha por W.O. Sair da partida também dá W.O. ao oponente.
- **Contas**: convidado (só nick, sem lista de amigos, sessão de 30 dias) ou conta com Google, Discord ou Steam (Nome#1234, com amigos, 180 dias). Um convidado vira conta ao entrar com um login.
- **Achar partida**: sala com código de 6 letras, convite para amigo (aparece como aviso no canto da tela) e fila pública.

## Variáveis de ambiente

Veja `.env.example`. No computador, crie `.env.local` (já está no `.gitignore`). Na Vercel: *Project > Settings > Environment Variables*.

| Variável | Onde pegar | Obrigatória |
|---|---|---|
| `DATABASE_URL` | Supabase > Project Settings > Database > Connection string > **Transaction pooler** (porta 6543), com a senha do banco | Sim, em produção |
| `AUTH_SECRET` | Gere: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | Sim, em produção |
| `APP_URL` | O domínio da Vercel, ex.: `https://card-strike.vercel.app` | Sim, para os logins |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase > Project Settings > API | Sim, para o tempo real |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Project Settings > API (secreta) | Não |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud Console | Para login Google |
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | Discord Developer Portal | Para login Discord |
| `STEAM_APP_ID` / `STEAM_WEB_API_KEY` | Steamworks (partner.steamgames.com) | Quando for para a Steam |

As tabelas são criadas sozinhas na primeira chamada da API (migrações em `lib/server/migrations.ts`).

### Login com Google

1. console.cloud.google.com → crie um projeto → *APIs e serviços > Tela de consentimento OAuth* (externo, nome "Card Strike").
2. *Credenciais > Criar credenciais > ID do cliente OAuth > Aplicativo da Web*.
3. URIs de redirecionamento autorizados: `https://SEU-DOMINIO/api/auth/google/callback` e, para testar no computador, `http://localhost:3000/api/auth/google/callback`.
4. Copie o ID e a chave secreta para `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`.

### Login com Discord

1. discord.com/developers/applications → *New Application*.
2. *OAuth2 > Redirects*: `https://SEU-DOMINIO/api/auth/discord/callback` (e o de `localhost:3000`).
3. Copie *Client ID* e *Client Secret* (Reset Secret) para `DISCORD_CLIENT_ID` e `DISCORD_CLIENT_SECRET`.

## Testar no computador

```bash
npm run dev
```

Sem `DATABASE_URL`, o banco fica em `.data/pglite`. Para jogar contra você mesmo, abra `http://localhost:3000` numa aba e `http://127.0.0.1:3000` em outra (cada endereço tem o seu cookie). No desenvolvimento aparece o botão "Conta de teste" para criar contas com amigos sem Google/Discord.

## Steam

A pasta `desktop/` tem o app de desktop (Electron + steamworks.js). Veja `desktop/README.md`.
