import { Bombsite, GameState, TeamName } from "@/game/game-types";
import { GameAction } from "@/game/game-actions";
import { gameReducer } from "@/game/game-reducer";
import { createInitialGameState } from "@/game/game-initital-state";
import { isGameOver, opponentOf, winnerOf } from "@/game/card-effects";
import { HttpError } from "./users";

/* ═══════════════════════════════════════════════
   MOTOR DA PARTIDA ONLINE (servidor)
   Usa o mesmo reducer do jogo local; o servidor é a
   única fonte da verdade. Diferenças do local:
   - sorteios (dado, roleta, cartas) acontecem aqui;
   - o relógio vira um prazo (deadline): quando passa,
     qualquer jogador pode cobrar e o servidor aplica a
     mesma regra de tempo esgotado do modo local.
   Funções puras: quem grava no banco é matches.ts.
   ═══════════════════════════════════════════════ */

const BOMBSITES: Bombsite[] = ["A", "B", "C"];

/** Sorteio guardado enquanto o dado/roleta anima nos dois clientes. */
export type PendingRoll = { id: number; tool: "d6" | "spinner"; team: TeamName; d6: number; spinner: Bombsite; timerAfter?: number };

export type Snapshot = { state: GameState; deadline: number | null; pendingRoll: PendingRoll | null };

/** Ações que o jogador da vez pode mandar (o resto é do servidor). */
const CLIENT_ACTIONS = new Set([
  "SELECT_ACTION",
  "SET_TOOL",
  "BUY_CARD",
  "PLACE_CARD",
  "PLAY_CARD",
  "KEEP_IN_HAND",
  "SWITCH_TAB",
  "TOGGLE_INVENTORY",
]);

/** Ações que sempre reiniciam o relógio do turno. */
const RESETS_CLOCK = new Set(["END_TURN", "ROLL_TOOL_COMPLETE", "PLACE_CARD", "PLAY_CARD", "KEEP_IN_HAND", "SELECT_ACTION"]);

/** Tempo extra para o dado/roleta terminar a animação antes de alguém cobrar. */
export const ROLL_GRACE_MS = 9_000;

export const newMatchState = (police: string, faction: string): GameState =>
  createInitialGameState({ police: { playerName: police }, faction: { playerName: faction }, botTeam: null });

const apply = (snap: Snapshot, action: GameAction, now: number): Snapshot => {
  const state = gameReducer(snap.state, action);
  const reset = RESETS_CLOCK.has(action.type) || state.countdown.seconds !== snap.state.countdown.seconds;
  return { ...snap, state, deadline: reset ? now + state.countdown.seconds * 1000 : snap.deadline };
};

const ensureTurn = (snap: Snapshot, team: TeamName) => {
  if (isGameOver(snap.state)) throw new HttpError(409, "A partida já acabou.");
  if (snap.state.currentTeam !== team) throw new HttpError(409, "Não é a sua vez.");
};

/**
 * Refaz a ação só com dados que o servidor confia: a carta jogada vem do slot
 * sorteado (nunca do cliente) e os índices precisam existir.
 */
const sanitize = (state: GameState, team: TeamName, action: GameAction): GameAction => {
  const { hand, warZone } = state.teams[team].inventory;
  const d6 = state.tool.result.d6;
  switch (action.type) {
    case "PLAY_CARD": {
      const card = d6 ? warZone[d6 - 1] : null;
      if (!card || card.id !== action.payload?.card?.id) throw new HttpError(400, "Só a carta do slot sorteado pode ser jogada.");
      return { type: "PLAY_CARD", payload: { card } };
    }
    case "PLACE_CARD": {
      const { cardIndex, positionIndex } = action.payload ?? {};
      if (!Number.isInteger(cardIndex) || cardIndex < 0 || cardIndex >= hand.length) throw new HttpError(400, "Carta inválida.");
      if (!d6 || positionIndex !== d6 - 1) throw new HttpError(400, "Só dá para posicionar no slot sorteado.");
      return { type: "PLACE_CARD", payload: { cardIndex, positionIndex } };
    }
    case "SET_TOOL":
      if (action.payload !== "d6" && action.payload !== "spinner") throw new HttpError(400, "Ferramenta inválida.");
      return { type: "SET_TOOL", payload: action.payload };
    case "SWITCH_TAB":
      if (action.payload !== "battlefieldTab" && action.payload !== "actionTab") throw new HttpError(400, "Aba inválida.");
      return { type: "SWITCH_TAB", payload: action.payload };
    default:
      return { type: action.type } as GameAction;
  }
};

/** Ação do jogador da vez (comprar, posicionar, jogar...). */
export const clientAction = (snap: Snapshot, team: TeamName, action: GameAction, now: number): Snapshot => {
  ensureTurn(snap, team);
  if (!CLIENT_ACTIONS.has(action?.type)) throw new HttpError(400, "Ação inválida.");
  if (snap.pendingRoll) throw new HttpError(409, "Espere o sorteio terminar.");
  return apply(snap, sanitize(snap.state, team, action), now);
};

/** Lança o dado ou gira a roleta: sorteia aqui e começa a animação. */
export const startRoll = (snap: Snapshot, team: TeamName, now: number, timerAfter?: number): Snapshot => {
  ensureTurn(snap, team);
  const tool = snap.state.tool.selected;
  if (!tool || snap.state.tool.isRolling || snap.pendingRoll) throw new HttpError(409, "Nada para sortear agora.");
  // Ao se reposicionar sempre muda de lugar: o site atual fica fora do sorteio.
  const sites = BOMBSITES.filter((site) => site !== snap.state.teams[team].position);
  const pendingRoll: PendingRoll = {
    id: now,
    tool,
    team,
    d6: 1 + Math.floor(Math.random() * 6),
    spinner: sites[Math.floor(Math.random() * sites.length)],
    timerAfter,
  };
  const next = apply(snap, { type: "ROLL_TOOL_START" }, now);
  return { ...next, pendingRoll, deadline: now + ROLL_GRACE_MS };
};

/** Fim da animação do sorteio: aplica o resultado guardado. */
export const finishRoll = (snap: Snapshot, now: number): Snapshot => {
  const roll = snap.pendingRoll;
  if (!roll) throw new HttpError(409, "Nenhum sorteio em andamento.");
  const next = apply(
    { ...snap, pendingRoll: null },
    { type: "ROLL_TOOL_COMPLETE", payload: { d6: roll.d6, spinner: roll.spinner, timerAfter: roll.timerAfter } },
    now,
  );
  return next;
};

/**
 * Tempo esgotado (prazo vencido): a mesma regra do modo local.
 * Compra, joga ou posiciona sozinho, rola o dado ou passa a vez.
 */
export const timeout = (snap: Snapshot, now: number): Snapshot => {
  if (snap.deadline != null && now < snap.deadline - 500) throw new HttpError(409, "Ainda há tempo.");
  if (snap.pendingRoll) return finishRoll(snap, now);

  const { state } = snap;
  const team = state.currentTeam;
  const { hand, warZone } = state.teams[team].inventory;

  switch (state.turnPhase) {
    case "BUYING":
    case "PLACING": {
      if (state.turnPhase === "BUYING" && hand.length < 3) return apply(snap, { type: "BUY_CARD" }, now);
      const d6 = state.tool.result.d6;
      if (d6) {
        const drawn = warZone[d6 - 1];
        if (drawn) return apply(snap, { type: "PLAY_CARD", payload: { card: drawn } }, now);
        if (hand.length === 0) {
          const bought = apply(snap, { type: "BUY_CARD" }, now);
          // Comprou sem mudar o relógio: dá mais um instante para posicionar.
          return { ...bought, deadline: now + 3000 };
        }
        return apply(
          snap,
          { type: "PLACE_CARD", payload: { cardIndex: Math.floor(Math.random() * hand.length), positionIndex: d6 - 1 } },
          now,
        );
      }
      return apply(snap, { type: "END_TURN" }, now);
    }
    case "CHOOSING":
    case "ACTING": {
      // Sem escolha a tempo: rola o dado sozinho e dá 5 s para posicionar.
      const withDice = apply(snap, { type: "SET_TOOL", payload: "d6" }, now);
      const rolling = startRoll(withDice, team, now, 5);
      return finishRoll(rolling, now);
    }
    default:
      return apply(snap, { type: "END_TURN" }, now);
  }
};

export const outcome = (state: GameState) => (isGameOver(state) ? winnerOf(state) : null);

export { opponentOf };
