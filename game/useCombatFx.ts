import { useEffect, useState } from "react";
import {
  FX_FLIGHT_MS,
  FX_INTRO_MS,
  fxHoldEnd,
  fxImpacts,
  fxRemainingDamage,
  fxTotalMs,
} from "./card-fx";
import { Card } from "@/lib/types";
import { CombatEvent, TeamName } from "./game-types";

export type FxStage = "flight" | "camera" | "action" | "return" | "done";

/** Toca a linha do tempo da carta jogada e diz o que já aconteceu nela. */
export const useCombatFx = (event: CombatEvent | null) => {
  const [progress, setProgress] = useState({ id: 0, stage: "flight" as FxStage, landed: 0 });

  const eventId = event?.id;
  useEffect(() => {
    if (!event) return;

    const update = (patch: Partial<typeof progress>) =>
      setProgress((current) => ({ ...current, ...patch }));

    setProgress({ id: event.id, stage: "flight", landed: 0 });
    const timers = [
      window.setTimeout(() => update({ stage: "camera" }), FX_FLIGHT_MS),
      window.setTimeout(() => update({ stage: "action" }), FX_INTRO_MS),
      ...fxImpacts(event).map((ms, i) =>
        window.setTimeout(() => update({ landed: i + 1 }), FX_INTRO_MS + ms),
      ),
      window.setTimeout(() => update({ stage: "return" }), fxHoldEnd(event)),
      window.setTimeout(() => update({ stage: "done" }), fxTotalMs(event)),
    ];

    return () => timers.forEach(window.clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  // Antes do efeito rodar, o evento novo já conta como recém-começado.
  const { stage, landed } =
    event && progress.id === event.id ? progress : { stage: "flight" as FxStage, landed: 0 };
  const active = !!event && stage !== "done";

  return {
    event: active ? event : null,
    stage,
    landed,
    active,
    /** Dano já aplicado no jogo que a barra de vida ainda não deve mostrar. */
    pendingDamage: (team: TeamName) =>
      active && team === event.target ? fxRemainingDamage(event, landed) : 0,
    /** Efeito da carta só aparece no mapa quando ela chega lá. */
    hidesEffect: (cardId: Card["id"]) => active && landed === 0 && cardId === event.card.id,
  };
};

export type CombatFx = ReturnType<typeof useCombatFx>;
