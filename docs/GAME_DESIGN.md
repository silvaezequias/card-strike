# Card Strike: como o jogo funciona

Documento de referência do jogo inteiro: a ideia, as regras, a divisão dos turnos, as cartas, os modos, o BOT e o online. Foi escrito a partir do código (é ele que manda, se algo divergir) para quem for estudar o jogo do zero.

**Regra × apresentação.** O que importa aqui é **como o jogo funciona**: regras, turnos, cartas e condições de vitória. Tudo o que descreve a **apresentação atual** (mesa de cartas, slots desenhados, painéis, câmera, banner de "vez de", animações, tempos de pausa, HUD) é só a forma como a versão de hoje mostra essas regras, e pode ser feito de outro jeito. A seção 13 separa uma coisa da outra.

> Leia junto: [`docs/ONLINE.md`](ONLINE.md) (servidor, banco, contas e deploy) e [`desktop/README.md`](../desktop/README.md) (app da Steam).

---

## 1. Visão geral

Card Strike é um jogo de **tabuleiro e cartas por turnos, para 2 lados**, com o tema dos jogos de tiro tático (bomba, bombsites, armas, granadas).

- **Militar (CT)** contra **Terrorista (TR)**. No código os times se chamam `police` (Militar) e `faction` (Terrorista): os nomes de tela mudaram, os identificadores não.
- Cada jogador tem **10 de vida** (`MAX_HEALTH`).
- O mapa tem uma **base** de cada time e três **bombsites: A, B e C**.
- Cada turno, o jogador escolhe **uma** de duas ações: **se posicionar** (roleta, vai para um bombsite) ou **posicionar carta** (dado de 6 lados, sorteia um dos seus 6 slots, onde ele coloca ou joga uma carta).
- Cartas de ataque só acertam o oponente se os dois estiverem **no mesmo bombsite** ("confronto").

**Como se vence**

| Quem | Como |
|---|---|
| Terrorista | Zerar a vida do Militar, **ou** fazer a bomba explodir (modo Sabotagem), **ou** destruir os três bombsites (modo Dominação) |
| Militar | Zerar a vida do Terrorista |

Não há empate nem limite de rodadas. Código: `winnerOf` e `isGameOver` em `game/card-effects.ts`.

---

## 2. Componentes do jogo

### Mesa de cartas (tabuleiro principal)
- **6 slots por time** (a "zona de guerra", `inventory.warZone`, sempre 6 posições). O Militar fica à **esquerda**, o Terrorista à **direita**.
- **Baralho** de cada time (de onde se compra).
- **Zona de combate** no centro: onde a carta jogada pousa.
- **Mão** de cada jogador: até **3 cartas** (`MAX_HAND_SIZE`), mostrada embaixo da tela só para o dono.

### Mapa tático
- Base do Militar, base do Terrorista e os sites **A, B, C**. Cada time tem uma posição (`position`): `null` = ainda na base; depois sempre um site.
- Mostra os peões, a bomba plantada e os efeitos no mapa (Smoke, fogo da Molotov).

### Dado (d6) e roleta
- **Dado**: sorteia de 1 a 6 = o slot do jogador (slot `d6 - 1`).
- **Roleta**: sorteia um bombsite para onde o jogador vai. **Nunca cai no site onde ele já está** e, na Dominação, nunca cai num site destruído (`spinnerSites`).

### Bomba
- Plantada pela carta BOMBA (só o Terrorista tem) no site onde o Terrorista está.
- Fica armada por **5 rodadas** (`maxTime`); ver seção 6.

---

## 3. Cartas

Cada time compra de um baralho próprio: **armas do time + utilitários compartilhados**. A compra é **aleatória e uniforme** no conjunto (`generateRandomCard`, `lib/game-helpers.tsx`). Não há custo nem dinheiro.

### Armas (categoria ARMA): dano direto, só em confronto

| Carta | Dano | Militar | Terrorista | Observação |
|---|---|---|---|---|
| USP | 2 | ✔ | | pistola |
| GLOCK | 2 | | ✔ | pistola |
| M4A1 | 3 | ✔ | | rifle |
| AK-47 | 3 | | ✔ | rifle |
| DESERT EAGLE | 5 | ✔ | ✔ | pistola pesada |
| AWP | 8 | ✔ | ✔ | sniper, **um tiro só** na animação |

- **Bloqueadas pela Smoke do alvo** (se o alvo estiver dentro da Smoke dele).
- Animação: um projétil por ponto de dano (ex.: AK-47 = 3 tiros), exceto a AWP (1 tiro com todo o dano). `shotCount` em `game/card-fx.ts`.

### Objetivo

| Carta | Time | Efeito |
|---|---|---|
| BOMBA | Terrorista | Planta a bomba no site atual do Terrorista. Falha se ele estiver na base, se já houver bomba plantada ou se o site estiver destruído. |
| KIT DEFUSE | Militar | Desarma a bomba plantada. **Funciona de qualquer lugar** (o código não exige estar no site da bomba). Sem bomba, não faz nada. |

### Utilitários (os dois times)

| Carta | Efeito | Duração |
|---|---|---|
| **Granada** | 4 de dano em confronto. Se o alvo tiver Smoke dele no site: **metade (2) e destrói a Smoke**. Fora de confronto: só destrói a Smoke do oponente se houver uma no seu site. | instantânea |
| **Smoke** | Cobre o **site de quem jogou** (ou a base, se estiver nela). Protege quem a jogou **enquanto ele estiver lá**: bloqueia armas, bloqueia Molotov, corta a Granada pela metade. Se houver fogo de Molotov no site, a Smoke **apaga o fogo** (e não fica). | 3 rodadas |
| **Molotov** | Deixa **fogo no site de quem jogou**; não precisa de confronto. O fogo queima **o oponente** que estiver ou chegar ao site: **1 de dano** cada vez que ele termina a vez lá. Não queima quem jogou. Bloqueada pela Smoke **do oponente** no site; a Smoke de quem joga **não** bloqueia a própria Molotov. Falha se quem joga está na base. | 3 rodadas |
| **Flashbang** | Em confronto, **cega o oponente**: ele **perde a próxima vez**. Ver regras de vez na seção 5. | 1 rodada |
| **Capacete** | +2 de vida para quem jogou (máximo 10). | instantânea |
| **Colete** | +4 de vida para quem jogou (máximo 10). | instantânea |

- **Carta de ataque** (`isAttackCard`): toda carta ofensiva menos a BOMBA, ou seja, armas, Granada, Molotov e Flashbang. Fora de confronto, jogar uma delas pede confirmação: o primeiro clique mostra o aviso de **fora de alcance** (contorno vermelho e triângulo com "!"); o segundo joga mesmo assim.
- Os textos de cada carta estão em `lib/card-catalog.ts`; os números, em `lib/game-helpers.tsx` (`policeWeapons`, `factionWeapons`, `sharedUtilities`). As regras de verdade estão em `resolveCard` (`game/card-effects.ts`).

---

## 4. A partida passo a passo

### Começo
1. Os dois times começam **na base**, com **10 de vida** e **mão vazia**.
2. **Distribuição**: 3 cartas para cada time, alternando, saindo do baralho. Na versão atual, as cartas do jogador voam de costas até a mão e viram ao chegar; as do oponente vão de costas até o cartão dele (`components/game/deal-layer.tsx`). Durante a distribuição o relógio fica parado.
3. **O Terrorista começa.**

### Um turno
O turno tem **fases** (`turnPhase`):

```
COUNTDOWN ──(banner "vez de X", 1,3 s)──▶ CHOOSING ──▶ ACTING ──▶ PLACING ──▶ IDLE ──▶ fim do turno
                                          (escolhe)    (rola)     (só dado)   (pausa)
```

1. **COUNTDOWN**: aparece o aviso de quem joga. Depois de 1,3 s vem `SELECT_ACTION`.
2. **CHOOSING**: o jogador escolhe entre:
   - **Se posicionar** → roleta;
   - **Posicionar carta** → dado.
3. **ACTING**: lança a ferramenta. O dado pode ser segurado para balançar e solto para lançar; a roleta gira.
4. Resultado:
   - **Roleta**: o jogador vai para o site sorteado → **IDLE por 3 s** → fim do turno.
   - **Dado**: abre a fase **PLACING** com **30 s**, no slot sorteado do jogador:
     - **slot vazio** → escolher uma carta da mão e colocá-la ali (clique ou arraste). Antes, pode **comprar** 1 carta do baralho (**uma compra por turno**, só se a mão tiver menos de 3).
     - **slot com carta** → **jogar** a carta (clique nela; ela vai para a zona de combate e o efeito acontece) **ou mantê-la** ("manter carta", não joga nada).
5. **IDLE**: pausa para as animações (3 s ao posicionar/manter; o tempo da animação de combate ao jogar uma carta). Depois, **fim do turno**.

Ações do reducer: `game/actions/*.ts` (uma por arquivo), ligadas em `game/game-reducer.ts`.

### Relógio e tempo esgotado
Cada turno tem **60 s**. Quando o tempo de uma fase acaba (`handleEndTime` em `game/useGameEngine.ts`; no online, `timeout` em `lib/server/match-engine.ts`):

| Fase | O que acontece sozinho |
|---|---|
| CHOOSING / ACTING | Escolhe o dado e rola; o jogador ganha **5 s** para posicionar |
| PLACING, slot com carta | **Joga** a carta do slot |
| PLACING, slot vazio e mão vazia | **Compra** uma carta (e posiciona no tique seguinte) |
| PLACING, slot vazio | **Posiciona** uma carta aleatória da mão no slot |
| IDLE | Fim do turno |

### Rodada
- **Rodada = os dois jogarem.** O Terrorista abre a rodada e o **Militar fecha** (`ROUND_CLOSER = police`). A rodada avança quando o Militar termina a vez.

### Fim do turno (`resolveEndOfTurn` + `ActionEndTurn`)
Quando o time X termina a vez:
1. Os **efeitos presos a X** (Flashbang) perdem 1 de duração.
2. O **fogo do oponente** no site de X causa o dano dele em X.
3. Os **efeitos de mapa do oponente** (Smoke e Molotov dele) perdem 1 de duração; os do próprio X não. Assim cada efeito dura N rodadas completas.
4. Se X é o Militar (fecha a rodada) e há bomba armada, a **bomba conta 1**.
5. A vez passa para o outro time.

---

## 5. Flashbang e perda de vez

- Quando a Flashbang acerta, o alvo fica **cego** (efeito com duração 1).
- No fim da vez de quem jogou a flash, **a vez do cegado é perdida na hora, sem passar por ele**: ela conta como uma vez jogada (o efeito acaba, o fogo queima, a bomba conta, a rodada avança) e a vez volta direto para quem jogou (`game/actions/endTurn.ts`).
- **Tela branca**: aparece no instante em que a flash **cai** no alvo, por 4 s, **só para quem foi atingido**. Contra o BOT e online, só se o atingido for o jogador daquela tela; no modo local (tela compartilhada), sempre. Existe a opção "Flash suave" para pessoas sensíveis a clarões.

---

## 6. Bomba e modos de jogo

### Sabotagem (padrão; no banco online ainda se chama `bombsite`)
- Plantada, a bomba conta **5 rodadas** (desce 1 quando o Militar fecha a rodada).
- Chegando a 0, **explode**: 10 de dano no Militar (onde quer que ele esteja) e a **partida acaba com vitória do Terrorista**.
- O **KIT DEFUSE** desarma: a bomba sai do mapa e o contador volta a 5.
- A música da partida troca para a versão acelerada ao plantar e **acelera mais a cada rodada**, até o máximo no último round antes da explosão.

### Dominação (`rules.competitive = true`; online `domination`)
- A explosão **destrói só o site da bomba** e causa 10 de dano em **quem estiver nele, de qualquer time**.
- O site destruído **sai do mapa e da roleta**; os efeitos que estavam nele somem. A bomba volta a poder ser plantada em outro site.
- O Terrorista vence ao **destruir os três sites** (ou zerando o Militar).

---

## 7. Regras opcionais (lobby)

`GameRules` em `game/game-types.ts`, escolhidas antes da partida (lobby local ou sala online):

| Regra | Efeito |
|---|---|
| `competitive` | Liga o modo **Dominação** (seção 6) |
| `hiddenCards` (**Cartas ocultas**) | Você não vê as cartas do oponente, nem na mão nem nos 6 slots, até ele jogar uma (os slots aparecem de costas; o aviso do dado diz "carta oculta"). **No online o servidor nem envia o conteúdo dessas cartas** (`redactFor` em `lib/server/match-engine.ts`). |

---

## 8. Modos de partida

| Modo | Como é |
|---|---|
| **1 jogador** | Contra o BOT (seção 9) |
| **Local** | Dois jogadores revezando no mesmo computador; a tela é sempre de quem está na vez |
| **Online** | Dois jogadores em computadores diferentes, com o servidor decidindo tudo (seção 10) |
| **Tutorial** | Partida roteirizada com a Sargento Vega, que ensina posicionar, montar o arsenal e atacar (`lib/tutorial/default-script.ts`; editor em `/tutorial/editor`) |

### Fluxo do menu até a partida
1. **Aba Jogar**: escolhe o tipo (1 jogador / Local / Online), o **modo** (Sabotagem ou Dominação, em cartões), os **nomes** dos jogadores e as **regras**.
2. **JOGAR** → **escolha de times** em tela cheia (Terrorista à esquerda, Militar à direita, cada um com o seu operador): clicar num lado leva o jogador da vez para lá; dá para aleatorizar. Contra o BOT, ele fica com o lado que sobrar.
3. Partida.

---

## 9. BOT

Arquivos: `game/bot-brain.ts` (decide) e `game/useBot.ts` (executa com pausas de 1,1 s para o humano acompanhar; balança o dado antes de lançar).

- **Escolha da ação**: na base, sempre a roleta. Com uma carta de ataque nos slots e fora de confronto, vai atrás do oponente com 60% de chance (roleta); senão, dado.
- **Slot com carta**: joga se valer a pena (BOMBA se estiver num site e sem bomba; KIT só com bomba plantada; Smoke se ainda não estiver protegido; Molotov se o site não tiver Smoke do oponente; cura se não passar de 10; ataques só em confronto, e armas não contra quem está na Smoke). Senão, mantém.
- **Slot vazio**: compra se a mão estiver vazia; senão coloca a carta de maior valor (dano ou cura).

---

## 10. Online (resumo)

Detalhes em [`docs/ONLINE.md`](ONLINE.md).

- **O servidor manda**: o mesmo `gameReducer` roda no servidor (`lib/server/match-engine.ts`). O cliente só envia a jogada; **dado, roleta e compras são sorteados no servidor**; jogadas fora da vez ou inválidas são recusadas.
- **Relógio = prazo** (`deadline`): quando passa, qualquer jogador cobra e o servidor aplica a regra de tempo esgotado.
- **Tempo real**: o servidor avisa pelo Supabase Realtime e os clientes buscam o estado novo.
- **Sem atraso na mão**: a jogada aparece na hora (previsão local) e é confirmada pelo servidor; se ele recusar, volta (`lib/online/use-online-engine.ts`).
- **Ausência**: 60 s sem sinal → vitória do outro por W.O.; sair da partida também dá W.O.
- **Contas**: convidado (só nick) ou conta Google/Discord/Steam com `Nome#1234`, amigos, convites e presença.
- **Achar partida**: sala com código, convite de amigo (menu de contexto) e fila pública.
- Hospedagem: Vercel (funções em `pdx1`, perto do banco) + Supabase (Postgres em us-west-2).

---

## 11. Interface e apresentação (versão atual)

- **Estilo visual "noir"**: ilustração plana com luz de recorte colorida. Cores dos times: Militar em **azul** (`policePalette`, rim `#86e3ff`) e Terrorista em **vermelho** (`factionPalette`, rim `#ff8197`), em `components/art/palette.ts`.
- **Personagens**: 4 operadores em SVG (2 por time) em `public/art/characters/`, recoloridos na paleta de cada time.
- **Cartas**: desenhadas em SVG (`components/art/noir-card.tsx`, arte dos itens em `components/art/items.tsx`).
- **Câmera**: a mesa de cartas é um plano inclinado em CSS (`components/game/board-stage.tsx`) com enquadramentos (geral, minhas cartas, inimigo), zoom e rotação. O mapa e a roleta ficam em painéis ao lado (`map-board.tsx`, `roulette-board.tsx`), com o minimapa.
- **Efeitos de combate** (`components/game/combat-fx.tsx`, tempos em `game/card-fx.ts`): voo da carta até o mapa, tiros, granada, fogo, fumaça, clarão da flash, explosão da C4 com tremor de tela.
- **HUD**: cartão de cada jogador (vida, posição, efeitos ativos), cronômetro e rodada, painel da bomba, mão embaixo, seletor de ação. Quem só assiste a vez do oponente vê "Aguarde · <nome> está jogando" e o slot sorteado só com o contorno, sem instruções.
- **Som**: efeitos (`pistol`, `rifle`, `sniper`, `deagle`, `grenade`, `flashbang`, `smoke`, `fire`, `bomb-*`, `dice-*`) e música (menu calmo; guerra na partida; versão acelerada com a bomba). Arquivos em `public/audio/`, motor em `lib/game-audio.ts`.
- **Menu** no estilo dos jogos táticos (Inventário · Tutorial · **Jogar** · Histórico · Configurações), arena ao fundo, barra lateral de conta e amigos.
- **Configurações**: volumes por canal, brilho, contraste, saturação, desfoque, FPS, modo daltônico, tremor de tela, flash suave (`lib/settings.ts`).

---

## 12. Onde está cada coisa no código

| Pasta / arquivo | Conteúdo | Depende da tela? |
|---|---|---|
| `game/game-types.ts` | Tipos do estado (`GameState`, `Team`, `BombData`, `GameRules`) | Não |
| `game/game-reducer.ts` + `game/actions/` | Todas as ações (comprar, posicionar, jogar, rolar, fim de turno...) | Não |
| `game/card-effects.ts` | Regras das cartas, confronto, vitória, fim de turno, bomba | Não |
| `game/card-fx.ts` | Tempos e tipos das animações de combate | Não (só números) |
| `game/game-initital-state.ts` | Estado inicial | Não |
| `game/bot-brain.ts` | Decisões do BOT | Não |
| `lib/game-helpers.tsx` | Lista de cartas e sorteio | Não |
| `lib/card-catalog.ts` | Textos das cartas | Não |
| `game/useGameEngine.ts` | Motor local: relógio, tempo esgotado, rolagem | React (sem visual) |
| `game/useBot.ts`, `game/useSetupGame.ts`, `game/useGameSounds.ts` | BOT com pausas, lobby, sons | React |
| `lib/server/` | Servidor online (partida, salas, amigos, contas) | Não |
| `lib/online/` | Cliente online (API, tempo real, motor online) | React |
| `components/` | Toda a parte visual | Sim |
| `app/` | Páginas (menu, partida online, tutorial, cartas, tabuleiro) e rotas da API | Sim |

**Regras sem tela:** tudo de `game/` (menos os `use*.ts`), `lib/game-helpers.tsx`, `lib/card-catalog.ts` e `lib/server/` é TypeScript puro, sem nada visual. O reducer recebe o estado e uma ação e devolve o novo estado; o servidor online usa esse mesmo reducer. A parte visual inteira fica em `components/` e `app/`.

---

## 13. O que é regra e o que é apresentação

| É regra do jogo (a ideia) | É só a apresentação atual (pode ser feita de outro jeito) |
|---|---|
| Dois times, 10 de vida, Terrorista começa, Militar fecha a rodada | Os times aparecem como cartões com retrato no topo da tela |
| Cada turno: **ou** se posicionar **ou** posicionar carta | A escolha é feita em dois cartões grandes ("Posicionar carta" / "Se posicionar") |
| A posição é base ou um dos sites A, B, C; confronto = mesmo site | Mapa tático desenhado, minimapa, peões |
| O dado sorteia um dos **6 slots** do jogador; a roleta sorteia um site diferente do atual | Dado com física rolando sobre a mesa; roleta numa mesa própria |
| Slot vazio recebe uma carta da mão; slot com carta pode ser jogado ou mantido | Slots desenhados numa mesa de cartas; arrastar ou clicar |
| Mão de até 3 cartas, uma compra por turno | Baralho clicável na mesa; mão aberta embaixo da tela |
| Efeitos e números das cartas, bomba, Smoke, fogo, Flashbang, vitória | Animações de tiros, granada, fumaça, fogo, clarão e explosão |
| Limites de tempo por turno e o que acontece quando o tempo acaba | Banner de "vez de", contagem na HUD, pausas de 3 s entre ações (servem para dar tempo das animações) |
| Cartas ocultas: o oponente não sabe suas cartas até você jogar | Cartas de costas nos slots |
| Quem não está na vez só observa | Aviso "Aguarde · <nome> está jogando" |

A **distribuição inicial**, a **câmera**, a **mesa** e as **pausas** existem para apresentar o jogo; o que não pode mudar sem mudar o jogo são as regras da coluna da esquerda.

---

## 14. Decisões já tomadas (para manter)

Coisas definidas durante o desenvolvimento que podem não ser óbvias só pelo código:

- **Times**: Militar (CT) × Terrorista (TR); o Terrorista começa; o Militar fecha a rodada.
- **Vida máxima 10**, e as curas não passam disso.
- **A roleta sempre muda de site.**
- **A Smoke de quem joga não bloqueia a própria Molotov**; só a Smoke do oponente segura o fogo.
- **Flashbang**: a vez do cegado é pulada na hora, sem passar por ele, e a tela branca é só de quem recebeu, no momento em que a flash cai.
- **Cartas ocultas** valem também no servidor (nada vaza pela rede).
- **Uma compra por turno**, mão de no máximo 3.
- **Ataque fora de alcance** pede um segundo clique (aviso com triângulo vermelho e "!").
- **Quem assiste** a vez do oponente não recebe instruções de jogada, só o aviso de aguardar.
- **Música da bomba** acelera a cada rodada até a explosão.
- **Online**: o servidor é a fonte da verdade; a interface prevê a jogada para não ter atraso; abandono dá W.O. em 60 s.
