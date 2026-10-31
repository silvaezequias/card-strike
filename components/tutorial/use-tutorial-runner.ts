"use client";

import { MutableRefObject, useCallback, useEffect, useRef, useState } from "react";
import { GameEngine, ScriptedOutcomes } from "@/game/useGameEngine";
import { GateKey, GateState } from "@/components/game/tutorial-gate";
import { TutorialStep, actionTeam } from "@/lib/tutorial/types";

/* ═══════════════════════════════════════════════
   EXECUTOR DO TUTORIAL
   Avança o roteiro sobre o motor real do jogo:
   - troca de turno sozinho quando a ação é do outro time;
   - joga pelo bot com os resultados definidos no passo;
   - libera e destaca só a opção certa para o jogador;
   - percebe quando a ação do passo terminou.
   ═══════════════════════════════════════════════ */

const CLOSED: GateState = { allowed: [], highlight: null };

/** Tempo para a animação assentar antes de dar o passo como feito. */
const SETTLE_MS = { move: 2300, place: 1300, play: 2300 };

type StepRuntime = { started: boolean; fired: Set<string>; playedAtStart: number };

export const useTutorialRunner = ({
  game,
  steps,
  outcomes,
  active,
}: {
  game: GameEngine;
  steps: TutorialStep[];
  outcomes: MutableRefObject<ScriptedOutcomes>;
  /** false até o jogador clicar em "Começar". */
  active: boolean;
}) => {
  const [index, setIndex] = useState(0);
  const [actionDone, setActionDone] = useState(false);
  const step = steps[index] as TutorialStep | undefined;
  const action = step?.action;
  const team = action ? actionTeam(action) : null;

  const gameRef = useRef(game);
  gameRef.current = game;
  const runtime = useRef<StepRuntime>({ started: false, fired: new Set(), playedAtStart: 0 });
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  /** Executa `fn` uma única vez por passo para cada `key`. */
  const once = (key: string, ms: number, fn: () => void) => {
    const rt = runtime.current;
    if (rt.fired.has(key)) return;
    rt.fired.add(key);
    timers.current.push(window.setTimeout(fn, ms));
  };

  // Novo passo: zera o controle e define os resultados do dado/roleta/compra.
  useEffect(() => {
    if (!step) return;
    runtime.current = {
      started: false,
      fired: new Set(),
      playedAtStart: gameRef.current.state.playedCards.length,
    };
    setActionDone(!actionTeam(step.action));
    const a = step.action;
    outcomes.current = {
      spinner: "site" in a ? a.site : null,
      d6: a.kind !== "camera" && "slot" in a ? a.slot : null,
      card: "card" in a ? a.card : null,
    };
  }, [index, step, outcomes]);

  const { state } = game;

  useEffect(() => {
    if (!active || !step || !team || actionDone) return;
    const a = step.action;
    const rt = runtime.current;
    const { currentTeam, turnPhase, tool, teams, countdown, playedCards } = state;

    // 1) Espera o turno certo, passando a vez quando precisa.
    if (!rt.started) {
      if (currentTeam === team && turnPhase === "CHOOSING") {
        rt.started = true;
      } else if (turnPhase === "COUNTDOWN" || tool.isRolling) {
        return;
      } else {
        once(`end-turn-${countdown.round}`, 700, () => gameRef.current.dispatch({ type: "END_TURN" }));
        return;
      }
    }

    // 2) A ação do passo terminou?
    const mine = teams[team];
    const slotIndex = "slot" in a ? (a.slot ?? 1) - 1 : -1;
    const kind = a.kind.endsWith("move") ? "move" : a.kind.endsWith("place") ? "place" : "play";
    const finished =
      turnPhase === "IDLE" &&
      currentTeam === team &&
      (kind === "move"
        ? "site" in a && mine.position === a.site
        : kind === "place"
          ? !!mine.inventory.warZone[slotIndex]
          : playedCards.length > rt.playedAtStart);
    if (finished) {
      once("done", SETTLE_MS[kind], () => setActionDone(true));
      return;
    }

    // 3) Vez do bot: ele joga sozinho, com uma pausa entre as etapas.
    if (team !== "faction" || currentTeam !== "faction") return;
    const g = () => gameRef.current;

    if (turnPhase === "CHOOSING") {
      once("choose", 1100, () =>
        g().dispatch({ type: "SET_TOOL", payload: kind === "move" ? "spinner" : "d6" }),
      );
    } else if (turnPhase === "ACTING" && !tool.isRolling) {
      once("roll", 800, () => g().tool.roll());
    } else if (turnPhase === "PLACING") {
      const hand = mine.inventory.hand;
      if (kind === "play" && mine.inventory.warZone[slotIndex]) {
        once("play", 1100, () => {
          const card = g().state.teams.faction.inventory.warZone[slotIndex];
          if (card) g().dispatch({ type: "PLAY_CARD", payload: { card } });
        });
        return;
      }
      const wanted = "card" in a ? a.card : hand[0]?.name;
      const handIndex = hand.findIndex((c) => c?.name === wanted);
      if (handIndex < 0 && hand.length < 3) {
        once("buy", 900, () => g().dispatch({ type: "BUY_CARD" }));
      } else {
        once(`place-${hand.length}`, 1000, () =>
          g().dispatch({
            type: "PLACE_CARD",
            payload: { cardIndex: Math.max(0, handIndex), positionIndex: slotIndex },
          }),
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, active, index, actionDone]);

  /* ───────── O que o jogador pode fazer agora ───────── */

  let gate: GateState = CLOSED;
  let hint: string | null = null;

  if (active && step && team && !actionDone) {
    const a = step.action;
    const { currentTeam, turnPhase, tool, teams } = state;
    const slot = "slot" in a ? a.slot : null;

    if (turnPhase === "COUNTDOWN" || currentTeam !== team) {
      hint = "Trocando de turno...";
    } else if (team === "faction") {
      hint = "Aguarde a jogada da Facção...";
    } else {
      let key: GateKey | null = null;
      if (turnPhase === "CHOOSING") {
        key = a.kind === "player-move" ? "choose.spinner" : "choose.d6";
        hint = a.kind === "player-move" ? "Clique em SE POSICIONAR" : "Clique em POSICIONAR CARTA";
      } else if (turnPhase === "ACTING" && !tool.isRolling) {
        key = "roll";
        hint = a.kind === "player-move" ? "Clique em GIRAR ROLETA" : "Clique em ROLAR DADO";
      } else if (turnPhase === "PLACING") {
        if (a.kind === "player-play") {
          key = "play";
          hint = `Clique na carta do slot ${slot} para jogá-la`;
        } else if (a.kind === "player-place") {
          const hasCard = teams.police.inventory.hand.some((c) => c?.name === a.card);
          key = hasCard ? "place" : "buy";
          hint = hasCard
            ? `Arraste a carta até o slot ${slot} (ou clique nela)`
            : "Clique no BARALHO para comprar uma carta";
        }
      }
      if (key) gate = { allowed: [key], highlight: key };
    }
  }

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, steps.length - 1)), [steps.length]);

  // Passo de câmera: a tela foca a parte pedida enquanto ele durar.
  const camera = active && action?.kind === "camera" ? action : null;

  return {
    step,
    index,
    total: steps.length,
    actionDone,
    gate,
    hint,
    camera,
    next,
  };
};
