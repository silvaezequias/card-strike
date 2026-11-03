"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameAction } from "@/game/game-actions";
import { gameReducer } from "@/game/game-reducer";
import { GameState, TeamName } from "@/game/game-types";
import { isGameOver, opponentOf } from "@/game/card-effects";
import type { GameEngine } from "@/game/useGameEngine";
import { getSpinnerRotation } from "@/lib/game-helpers";
import { SPIN_MS, SPIN_READ_MS } from "@/components/game/roulette-board";
import { MatchView, api } from "./api";
import { subscribe } from "./realtime";

/* ═══════════════════════════════════════════════
   MOTOR DA PARTIDA ONLINE (cliente)
   Mesma cara do useGameEngine, então a tela do jogo
   não muda. A verdade está no servidor: cada jogada
   vira uma chamada da API e o estado volta pronto.
   O oponente entra como "botTeam": a tela já sabe
   esconder a mão dele e mostrar vitória/derrota.

   Sem atraso na mão: cada jogada entra numa fila de
   pendentes e aparece na hora (previsão local). As
   pendentes vão ao servidor em ordem, uma por vez, e
   são reaplicadas por cima de todo estado que chega
   até a resposta delas confirmar (ou desfazer, se o
   servidor recusar). Assim uma atualização antiga não
   faz a carta "voltar".
   ═══════════════════════════════════════════════ */

const SPINNER_MS = SPIN_MS + SPIN_READ_MS;
const DICE_FALLBACK_MS = 7000;
const HEARTBEAT_MS = 10_000;
/** Sem tempo real (aba parada, rede ruim): revisa o estado assim mesmo. */
const POLL_MS = 6_000;
/** Mostra o aviso de oponente sumido a partir daqui. */
export const AWAY_WARNING_MS = 15_000;
export const ABANDON_MS = 60_000;

/**
 * Jogadas previstas na hora. A compra fica de fora: a carta é sorteada no
 * servidor (a resposta chega em seguida).
 */
const PREDICTED = new Set([
  "SELECT_ACTION",
  "SET_TOOL",
  "SWITCH_TAB",
  "TOGGLE_INVENTORY",
  "PLACE_CARD",
  "KEEP_IN_HAND",
  "PLAY_CARD",
]);
const SENT_TO_SERVER = new Set([...PREDICTED, "BUY_CARD"]);

/**
 * Jogada esperando o servidor. `base` é a versão do estado em que ela vai ser
 * aplicada; um estado do servidor com versão maior já a inclui.
 */
type Pending = { id: number; action: GameAction | null; base: number };

export const useOnlineEngine = (matchId: string) => {
  const [match, setMatch] = useState<MatchView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [now, setNow] = useState(Date.now());
  const [opponentAwayMs, setOpponentAwayMs] = useState(0);
  const [dice, setDice] = useState<{
    shaking: boolean;
    roll: { id: number; value: number; team: TeamName } | null;
  }>({
    shaking: false,
    roll: null,
  });
  const [spinnerRotation, setSpinnerRotation] = useState({ x: 0, y: 0, z: 0 });
  const finishRollRef = useRef<(() => void) | null>(null);
  const skew = useRef(0);
  const version = useRef(-1);
  const posting = useRef(false);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const nextPendingId = useRef(0);
  const pendingCount = useRef(0);

  /** Guarda só respostas mais novas que a atual (chegam fora de ordem). */
  const accept = useCallback((next: MatchView) => {
    if (next.version < version.current) return;
    version.current = next.version;
    skew.current = next.serverNow - Date.now();
    setMatch(next);
  }, []);

  const refresh = useCallback(async () => {
    try {
      accept((await api.match(matchId)).match);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [accept, matchId]);

  // Estado inicial, avisos do servidor e revisão periódica.
  useEffect(() => {
    refresh();
    const off = subscribe([`match:${matchId}`], () => refresh());
    const poll = window.setInterval(refresh, POLL_MS);
    return () => {
      off();
      window.clearInterval(poll);
    };
  }, [matchId, refresh]);

  const you = match?.you ?? "police";
  const opponent = opponentOf(you);
  const active = match?.status === "active";
  // Estado do servidor com as jogadas ainda não confirmadas por cima.
  const base = useMemo(() => {
    if (!match) return null;
    return pending.reduce(
      (state, p) =>
        p.action && p.base >= match.version
          ? gameReducer(state, p.action)
          : state,
      match.state,
    );
  }, [match, pending]);

  // Relógio local a partir do prazo do servidor.
  useEffect(() => {
    const clock = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(clock);
  }, []);
  const serverNow = now + skew.current;
  const secondsLeft =
    match?.deadline != null && !match.pendingRoll
      ? Math.max(0, Math.ceil((match.deadline - serverNow) / 1000))
      : null;

  const state: GameState | null = useMemo(() => {
    if (!base) return null;
    return {
      ...base,
      botTeam: opponent,
      countdown:
        secondsLeft === null
          ? base.countdown
          : { ...base.countdown, seconds: secondsLeft },
    };
  }, [base, opponent, secondsLeft]);

  const myTurn = !!state && active && state.currentTeam === you;

  /**
   * Põe a jogada na fila: aparece na hora (se houver previsão) e vai ao
   * servidor depois das anteriores. Sai da fila quando a resposta chega.
   */
  const send = useCallback(
    (
      request: () => Promise<{ match: MatchView }>,
      predicted: GameAction | null = null,
      onFail?: () => void,
    ) => {
      const entry: Pending = {
        id: nextPendingId.current++,
        action: predicted,
        // Cada jogada aceita sobe a versão em 1: esta entra depois das da fila.
        base: version.current + pendingCount.current,
      };
      pendingCount.current++;
      setPending((list) => [...list, entry]);
      queue.current = queue.current.then(async () => {
        try {
          accept((await request()).match);
          setError(null);
        } catch (e) {
          setError((e as Error).message);
          onFail?.();
          refresh();
        } finally {
          pendingCount.current--;
          setPending((list) => list.filter((p) => p.id !== entry.id));
        }
      });
    },
    [accept, refresh],
  );

  const dispatch = useCallback(
    (action: GameAction) => {
      if (!myTurn || !match || !SENT_TO_SERVER.has(action.type)) return;
      send(
        () => api.action(matchId, action),
        PREDICTED.has(action.type) ? action : null,
      );
    },
    [myTurn, match, matchId, send],
  );

  // O dado segue balançando na mão até o servidor sortear; não "volta".
  // Só o dado balança: na roleta o balanço ficava ligado para sempre.
  const selectedTool = state?.tool.selected;
  const roll = useCallback(() => {
    if (
      !myTurn ||
      match?.pendingRoll ||
      finishRollRef.current ||
      state?.tool.isRolling
    )
      return;
    if (selectedTool === "d6") setDice((current) => ({ ...current, shaking: true }));
    send(
      () => api.roll(matchId),
      { type: "ROLL_TOOL_START" },
      () => setDice((current) => ({ ...current, shaking: false })),
    );
  }, [myTurn, match?.pendingRoll, state?.tool.isRolling, selectedTool, matchId, send]);

  // Vez nova: nenhum dado fica balançando da jogada anterior.
  const turnTeam = state?.currentTeam;
  useEffect(() => {
    setDice((current) => (current.shaking ? { ...current, shaking: false } : current));
  }, [turnTeam]);

  // Sorteio novo no servidor: anima o dado/roleta nos dois lados.
  // Quem rolou avisa o fim; se sumir, o prazo vence e o outro cobra.
  const serverRoll = match?.pendingRoll ?? null;
  const serverRollId = serverRoll?.id ?? null;
  useEffect(() => {
    if (!serverRoll) return;
    const mine = serverRoll.team === you;
    if (serverRoll.tool === "d6") {
      setDice({
        shaking: false,
        roll: {
          id: serverRoll.id,
          value: serverRoll.d6,
          team: serverRoll.team,
        },
      });
    } else {
      setDice((current) => (current.shaking ? { ...current, shaking: false } : current));
      const target = getSpinnerRotation(serverRoll.spinner);
      const spins = 5 + (serverRoll.id % 6);
      setSpinnerRotation((prev) => {
        let diff = target.z - (prev.z % 360);
        if (diff > 0) diff -= 360;
        return {
          x: 0,
          y: 0,
          z: prev.z - spins * 360 + diff + ((serverRoll.id % 40) - 20),
        };
      });
    }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      finishRollRef.current = null;
      if (mine)
        send(() => api.finishRoll(matchId), {
          type: "ROLL_TOOL_COMPLETE",
          payload: {
            d6: serverRoll.d6,
            spinner: serverRoll.spinner,
            timerAfter: serverRoll.timerAfter,
          },
        });
    };
    finishRollRef.current = finish;
    const timer = window.setTimeout(
      finish,
      serverRoll.tool === "d6" ? DICE_FALLBACK_MS : SPINNER_MS,
    );
    return () => {
      window.clearTimeout(timer);
      if (finishRollRef.current === finish) finishRollRef.current = null;
    };
    // Só quando chega um sorteio novo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverRollId]);

  // Prazo vencido: o jogador da vez cobra primeiro; o outro, um pouco depois.
  const deadline = match?.deadline ?? null;
  useEffect(() => {
    if (!active || deadline == null || posting.current) return;
    const late = serverNow - deadline;
    const turnOwner = match?.pendingRoll
      ? match.pendingRoll.team === you
      : myTurn;
    if (late < (turnOwner ? 300 : 2500)) return;
    posting.current = true;
    api
      .timeout(matchId)
      .then(({ match: next }) => accept(next))
      .catch(() => refresh())
      .finally(() => (posting.current = false));
  }, [
    active,
    deadline,
    serverNow,
    myTurn,
    match?.pendingRoll,
    you,
    matchId,
    accept,
    refresh,
  ]);

  // Sinal de vida; oponente sumido por 60 s → vitória por W.O.
  useEffect(() => {
    if (!active) return;
    const beat = async () => {
      try {
        const info = await api.heartbeat(matchId);
        setOpponentAwayMs(info.opponentAwayMs);
        if (info.version !== version.current) refresh();
        if (info.opponentAwayMs >= ABANDON_MS) {
          await api.claim(matchId).catch(() => {});
          refresh();
        }
      } catch {
        // rede caiu: tenta de novo no próximo
      }
    };
    beat();
    const timer = window.setInterval(beat, HEARTBEAT_MS);
    return () => window.clearInterval(timer);
  }, [active, matchId, refresh]);

  const leave = useCallback(async () => {
    await api.leaveMatch(matchId).catch(() => {});
    await refresh();
  }, [matchId, refresh]);

  if (!state || !match) return { ready: false as const, error };

  const engine: GameEngine = {
    state,
    dispatch,
    gameOver: !active || isGameOver(state),
    dealing: false,
    finishDeal: () => {},
    tool: {
      rotation: { spinner: spinnerRotation },
      roll,
      dice,
      shakeDice: (shaking: boolean) =>
        myTurn && setDice((current) => ({ ...current, shaking })),
      finishRoll: () => finishRollRef.current?.(),
    },
    teamNames: { faction: "Facção", police: "Polícia" },
    currentTeamName: state.currentTeam === "faction" ? "Facção" : "Polícia",
    currentPlayerName: state.teams[state.currentTeam].playerName,
  };

  return {
    ready: true as const,
    error,
    engine,
    match,
    you,
    opponent,
    myTurn,
    opponentAwayMs,
    leave,
  };
};
