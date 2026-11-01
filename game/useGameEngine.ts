import { MutableRefObject, useCallback, useEffect, useReducer, useRef, useState } from "react";
import { Bombsite, SetupSettings, TeamName, Tool } from "./game-types";
import { gameReducer } from "./game-reducer";
import { createInitialGameState } from "./game-initital-state";
import { getSpinnerRotation } from "@/lib/game-helpers";
import { GameAction } from "./game-actions";
import { isGameOver } from "./card-effects";

/** Resultados forçados para as próximas jogadas (tutorial roteirizado). */
export type ScriptedOutcomes = {
  d6?: number | null;
  spinner?: Bombsite | null;
  /** Nome da carta entregue na próxima compra. */
  card?: string | null;
};

const BOMBSITES: Bombsite[] = ["A", "B", "C"];
const SPINNER_MS = 3000;
/** Segurança: aba em segundo plano para o dado, e o jogo não pode travar. */
const DICE_FALLBACK_MS = 7000;

export type GameEngineOptions = {
  /** false desliga o relógio: nada acontece sozinho quando o tempo acaba. */
  timer?: boolean;
  /** Quando presente, dado, roleta e compra usam estes resultados. */
  script?: MutableRefObject<ScriptedOutcomes>;
  /** Cartas na mão de cada time no início; o tutorial começa sem nenhuma. */
  startingCards?: number;
};

export const useGameEngine = (setup: SetupSettings, options: GameEngineOptions = {}) => {
  const { timer = true, script, startingCards } = options;
  const startRotation = { x: 0, y: 0, z: 0 };
  const [dice, setDice] = useState<{
    shaking: boolean;
    roll: { id: number; value: number; team: TeamName } | null;
  }>({ shaking: false, roll: null });
  const finishRollRef = useRef<(() => void) | null>(null);
  const [spinnerRotation, setSpinnerRotation] = useState(startRotation);

  const [state, rawDispatch] = useReducer(gameReducer, undefined, () =>
    createInitialGameState(setup, startingCards),
  );

  // Com roteiro, a compra entrega a carta definida em vez de uma aleatória.
  const dispatch = useCallback(
    (action: GameAction) => {
      const cardName = script?.current.card;
      if (action.type === "BUY_CARD" && cardName) {
        rawDispatch({ type: "BUY_SCRIPTED_CARD", payload: { cardName } });
        return;
      }
      rawDispatch(action);
    },
    [script],
  );

  const currentTeam = state.currentTeam;
  const { hand: handInventory, warZone: warZoneInventory } =
    state.teams[currentTeam].inventory;

  const rollTool = (props: { timerAfter?: number; tool?: Tool } = {}) => {
    if (finishRollRef.current) return;
    const tool = props.tool ?? state.tool.selected;
    dispatch({ type: "ROLL_TOOL_START" });

    const d6Result = script?.current.d6 ?? Math.floor(Math.random() * 6) + 1;
    // Se reposicionar sempre muda de lugar: o site atual fica fora do sorteio.
    const otherSites = BOMBSITES.filter((site) => site !== state.teams[currentTeam].position);
    const spinnerResult =
      script?.current.spinner ??
      otherSites[Math.floor(Math.random() * otherSites.length)];

    const spinnerSpins = 5 + Math.floor(Math.random() * 6);

    const spinnerTargetRot = getSpinnerRotation(spinnerResult);

    setSpinnerRotation((prev) => {
      const currentZ = prev.z;
      const currentZMod = currentZ % 360;
      const randomOffset = Math.floor(Math.random() * 40) - 20;

      let diff = spinnerTargetRot.z - currentZMod;

      if (diff > 0) diff -= 360;
      return {
        x: 0,
        y: 0,
        z: currentZ - spinnerSpins * 360 + diff + randomOffset,
      };
    });

    // O dado termina quando para na mesa; a roleta, no fim do giro.
    const finish = () => {
      window.clearTimeout(timeout);
      finishRollRef.current = null;
      dispatch({
        type: "ROLL_TOOL_COMPLETE",
        payload: {
          d6: d6Result,
          spinner: spinnerResult,
          timerAfter: props?.timerAfter,
        },
      });
    };
    finishRollRef.current = finish;
    const timeout = window.setTimeout(finish, tool === "d6" ? DICE_FALLBACK_MS : SPINNER_MS);

    if (tool === "d6") {
      setDice({ shaking: false, roll: { id: Date.now(), value: d6Result, team: currentTeam } });
    }
  };

  const { seconds } = state.countdown;
  const { isRolling } = state.tool;

  const handleEndTime = () => {
    switch (state.turnPhase) {
      case "BUYING":
      case "PLACING":
        if (state.turnPhase === "BUYING" && handInventory.length < 3)
          return dispatch({ type: "BUY_CARD" });

        const d6Result = state.tool.result.d6;
        if (d6Result) {
          // Tempo esgotado: joga a carta do slot sorteado, se houver.
          const drawnCard = warZoneInventory[d6Result - 1];
          if (drawnCard) {
            return dispatch({
              type: "PLAY_CARD",
              payload: {
                card: drawnCard,
              },
            });
          }

          // Mão vazia: compra agora e posiciona no próximo tique.
          if (handInventory.length === 0) return dispatch({ type: "BUY_CARD" });

          dispatch({
            type: "PLACE_CARD",
            payload: {
              cardIndex: Math.floor(
                Math.random() * handInventory.filter((c) => c).length,
              ),
              positionIndex: d6Result - 1,
            },
          });
        }

        break;

      case "CHOOSING":
      case "ACTING":
        dispatch({ type: "SET_TOOL", payload: "d6" });

        setTimeout(() => {
          !state.tool.isRolling && rollTool({ timerAfter: 5, tool: "d6" });
          state.tool.isRolling = true;
        }, 100);

        break;

      case "IDLE":
      default:
        dispatch({ type: "END_TURN" });
    }
  };

  const gameOver = isGameOver(state);

  useEffect(() => {
    if (!timer || gameOver) return;
    const interval = setInterval(() => {
      if (state.countdown.seconds === 0) handleEndTime();

      dispatch({ type: "TIMER" });
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds, handInventory, isRolling, timer, gameOver]);

  return {
    state,
    dispatch,
    gameOver,
    tool: {
      rotation: {
        spinner: spinnerRotation,
      },
      roll: rollTool,
      dice,
      shakeDice: (shaking: boolean) => setDice((current) => ({ ...current, shaking })),
      finishRoll: () => finishRollRef.current?.(),
    },
    teamNames: { faction: "Facção", police: "Polícia" },
    currentTeamName: state.currentTeam === "faction" ? "Facção" : "Polícia",
    currentPlayerName: state.teams[state.currentTeam].playerName,
  };
};

export type GameEngine = ReturnType<typeof useGameEngine>;
