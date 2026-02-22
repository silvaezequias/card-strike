import { useEffect, useReducer, useState } from "react";
import { Bombsite, SetupSettings } from "./game-types";
import { gameReducer } from "./game-reducer";
import { createInitialGameState } from "./game-initital-state";
import { getD6Rotation, getSpinnerRotation } from "@/lib/game-helpers";

export const useGameEngine = (setup: SetupSettings) => {
  const startRotation = { x: 0, y: 0, z: 0 };
  const [d6Rotation, setD6Rotation] = useState(startRotation);
  const [spinnerRotation, setSpinnerRotation] = useState(startRotation);

  const [state, dispatch] = useReducer(
    gameReducer,
    createInitialGameState(setup),
  );

  const currentTeam = state.currentTeam;
  const { hand: handInventory, warZone: warZoneInventory } =
    state.teams[currentTeam].inventory;

  const rollTool = (props: { timerAfter?: number } = {}) => {
    dispatch({ type: "ROLL_TOOL_START" });

    const d6Result = Math.floor(Math.random() * 6) + 1;
    const spinnerResult = ["A", "B", "C"][
      Math.floor(Math.random() * 3)
    ] as Bombsite;

    const d6Spins = 3 + Math.floor(Math.random() * 4);
    const spinnerSpins = 5 + Math.floor(Math.random() * 6);

    const d6TargetRot = getD6Rotation(d6Result);
    const spinnerTargetRot = getSpinnerRotation(spinnerResult);

    setD6Rotation((prev) => {
      const currentXMod = prev.x % 360;
      const currentYMod = prev.y % 360;

      return {
        x: prev.x + d6Spins * 360 + (d6TargetRot.x - currentXMod),
        y: prev.y + d6Spins * 360 + (d6TargetRot.y - currentYMod),
        z: d6TargetRot.z + (Math.random() * 20 - 10),
      };
    });

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

    setTimeout(() => {
      dispatch({
        type: "ROLL_TOOL_COMPLETE",
        payload: {
          d6: d6Result,
          spinner: spinnerResult,
          timerAfter: props?.timerAfter,
        },
      });
    }, 3000);
  };

  const { seconds } = state.countdown;
  const { isRolling } = state.tool;

  const handleEndTime = () => {
    switch (state.turnPhase) {
      case "PLACING":
        if (handInventory.length < 3) return dispatch({ type: "BUY_CARD" });

        const d6Result = state.tool.result.d6;
        if (d6Result) {
          if (warZoneInventory[d6Result - 1]) {
            dispatch({
              type: "PLAY_CARD",
              payload: {
                card: warZoneInventory[d6Result - 1],
              },
            });
          }

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
          !state.tool.isRolling && rollTool({ timerAfter: 5 });
          state.tool.isRolling = true;
        }, 100);

        break;

      case "IDLE":
      default:
        dispatch({ type: "END_TURN" });
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (state.countdown.seconds === 0) handleEndTime();

      dispatch({ type: "TIMER" });
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds, handInventory, isRolling]);

  return {
    state,
    dispatch,
    tool: {
      rotation: {
        d6: d6Rotation,
        spinner: spinnerRotation,
      },
      roll: rollTool,
    },
    teamNames: { faction: "Facção", police: "Polícia" },
    currentTeamName: state.currentTeam === "faction" ? "Facção" : "Polícia",
    currentPlayerName: state.teams[state.currentTeam].playerName,
  };
};

export type GameEngine = ReturnType<typeof useGameEngine>;
