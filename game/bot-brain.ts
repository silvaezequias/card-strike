import { Card } from "@/lib/types";
import {
  MAX_HEALTH,
  inConfrontation,
  isAttackCard,
  isShielded,
  opponentOf,
  siteHasSmoke,
} from "./card-effects";
import { GameAction } from "./game-actions";
import { GameState, Tool } from "./game-types";

/* ═══════════════════════════════════════════════
   CÉREBRO DO BOT
   Olha o estado do jogo e escolhe a próxima jogada,
   usando as mesmas ações do jogador humano. Quem
   executa (e dá as pausas) é o useBot.
   ═══════════════════════════════════════════════ */

export type BotMove = { type: "roll" } | { type: "dispatch"; action: GameAction };

/** Chance de ir atrás do oponente quando tem ataque pronto e está longe. */
const HUNT_CHANCE = 0.6;

const dispatch = (action: GameAction): BotMove => ({ type: "dispatch", action });

/** Vale a pena gastar a carta agora? Senão ela fica guardada no slot. */
const shouldPlay = (state: GameState, card: Card) => {
  const team = state.currentTeam;
  const me = state.teams[team];

  if (card.name === "BOMBA") return !!me.position && !state.bomb.planted;
  if (card.name === "KIT DEFUSE") return state.bomb.planted;
  if (card.name === "Smoke") return !isShielded(state, team);
  // O fogo fica no site e pega o oponente mesmo que ele chegue depois.
  if (card.name === "Molotov") return !!me.position && !siteHasSmoke(state, me.position);
  if (card.healing) return me.health + card.healing <= MAX_HEALTH;
  if (!isAttackCard(card) || !inConfrontation(state)) return false;

  // Granada e Flashbang passam pela Smoke; armas não.
  return !(card.cardCategory === "ARMA" && isShielded(state, opponentOf(team)));
};

const chooseTool = (state: GameState): Tool => {
  const me = state.teams[state.currentTeam];
  if (!me.position) return "spinner";

  const canAttack = me.inventory.warZone.some((card) => card && isAttackCard(card));
  const shouldHunt = canAttack && !inConfrontation(state);
  return shouldHunt && Math.random() < HUNT_CHANCE ? "spinner" : "d6";
};

const cardValue = (card: Card) => card.damage || card.healing || 1;

/** Melhor carta da mão para o slot vazio. */
const bestHandCard = (hand: Card[]) =>
  hand.reduce((best, card, i) => (cardValue(card) > cardValue(hand[best]) ? i : best), 0);

const chooseForSlot = (state: GameState, slot: number) => {
  const { hand, warZone } = state.teams[state.currentTeam].inventory;
  const card = warZone[slot];

  if (card) {
    return shouldPlay(state, card)
      ? dispatch({ type: "PLAY_CARD", payload: { card } })
      : dispatch({ type: "KEEP_IN_HAND" });
  }

  if (hand.length === 0) return dispatch({ type: "BUY_CARD" });

  return dispatch({
    type: "PLACE_CARD",
    payload: { cardIndex: bestHandCard(hand), positionIndex: slot },
  });
};

/** Próxima jogada do time da vez; null quando não há nada a fazer. */
export const botMove = (state: GameState): BotMove | null => {
  const { d6 } = state.tool.result;

  switch (state.turnPhase) {
    case "CHOOSING":
      return dispatch({ type: "SET_TOOL", payload: chooseTool(state) });
    case "ACTING":
      return state.tool.isRolling ? null : { type: "roll" };
    case "PLACING":
      return d6 ? chooseForSlot(state, d6 - 1) : null;
    default:
      return null;
  }
};
