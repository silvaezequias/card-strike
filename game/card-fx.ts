import { Card } from "@/lib/types";
import { CombatEvent } from "./game-types";

/* ═══════════════════════════════════════════════
   ROTEIRO DOS EFEITOS
   O reducer resolve a carta na hora; aqui fica o
   tempo de cada animação no mapa. A linha do tempo:
   carta voa → câmera vai ao mapa → ação → volta.
   ═══════════════════════════════════════════════ */

export type FxKind = "shots" | "grenade" | "molotov" | "flashbang" | "smoke";

/** Voo da carta até a zona de combate. */
export const FX_FLIGHT_MS = 1500;
/** Fim da troca de câmera: a ação começa aqui. */
export const FX_INTRO_MS = 2300;
const FX_HOLD_MS = 500;
const FX_RETURN_MS = 900;
const FX_AFTERMATH_MS = 900;

export const BULLET_GAP_MS = 240;
export const BULLET_TRAVEL_MS = 160;
export const THROW_MS = 700;
const SMOKE_LAND_MS = 100;

export const BOMB_FX_MS = 3800;
/** Tempo com a tela branca da Flashbang. */
export const FLASH_BLIND_SECONDS = 4;
/** Tempo parado depois de uma carta sem animação. */
const NO_FX_SECONDS = 3;

export const fxKind = (card: Card): FxKind | null => {
  if (card.cardCategory === "ARMA") return "shots";

  switch (card.name) {
    case "Granada":
      return "grenade";
    case "Molotov":
      return "molotov";
    case "Flashbang":
      return "flashbang";
    case "Smoke":
      return "smoke";
    default:
      return null;
  }
};

/** Momentos (a partir do início da ação) em que o efeito acerta o alvo. */
export const fxImpacts = (event: CombatEvent): number[] => {
  switch (fxKind(event.card)) {
    case "shots":
      // Uma bala por ponto de dano da carta.
      return Array.from({ length: event.card.damage }, (_, i) => i * BULLET_GAP_MS + BULLET_TRAVEL_MS);
    case "smoke":
      return [SMOKE_LAND_MS];
    default:
      return [THROW_MS];
  }
};

/** Quando a ação termina, a partir do início dela. */
export const fxActionEnd = (event: CombatEvent) =>
  Math.max(...fxImpacts(event)) + FX_AFTERMATH_MS;

export const fxHoldEnd = (event: CombatEvent) =>
  FX_INTRO_MS + fxActionEnd(event) + FX_HOLD_MS;

export const fxTotalMs = (event: CombatEvent) => fxHoldEnd(event) + FX_RETURN_MS;

/** Segundos até passar a vez: o turno espera a animação acabar. */
export const fxSeconds = (event: CombatEvent | null) =>
  event ? Math.ceil(fxTotalMs(event) / 1000) : NO_FX_SECONDS;

/** Dano que o alvo ainda não sentiu, dado o número de impactos já mostrados. */
export const fxRemainingDamage = (event: CombatEvent, landed: number) =>
  fxKind(event.card) === "shots"
    ? Math.max(0, event.damage - landed)
    : landed > 0
      ? 0
      : event.damage;
