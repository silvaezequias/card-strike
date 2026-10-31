import { TeamName } from "@/game/game-types";
import {
  factionWeapons,
  policeWeapons,
  sharedUtilities,
} from "@/lib/game-helpers";
import type { Card } from "@/lib/types";

/* ═══════════════════════════════════════════════
   CATÁLOGO DE CARTAS
   Os números vêm dos pools em game-helpers; aqui
   ficam só os textos de mapa e interação.
   ═══════════════════════════════════════════════ */

type CardRules = {
  mapEffect: string | null;
  interactions: string[];
};

const CARD_RULES: Record<string, CardRules> = {
  "AK-47": {
    mapEffect: null,
    interactions: ["Bloqueada por Smoke ativa no alvo."],
  },
  M4A1: {
    mapEffect: null,
    interactions: ["Bloqueada por Smoke ativa no alvo."],
  },
  GLOCK: {
    mapEffect: null,
    interactions: ["Bloqueada por Smoke ativa no alvo."],
  },
  USP: {
    mapEffect: null,
    interactions: ["Bloqueada por Smoke ativa no alvo."],
  },
  "DESERT EAGLE": {
    mapEffect: null,
    interactions: ["Bloqueada por Smoke ativa no alvo."],
  },
  AWP: {
    mapEffect: null,
    interactions: ["Bloqueada por Smoke ativa no alvo."],
  },
  BOMBA: {
    mapEffect:
      "É plantada no bombsite (A, B ou C) e fica armada no mapa por 5 rounds.",
    interactions: ["Desarmada pelo KIT DEFUSE da polícia antes de explodir."],
  },
  "KIT DEFUSE": {
    mapEffect: "Remove a bomba plantada do bombsite.",
    interactions: ["Só tem efeito se houver uma BOMBA plantada."],
  },
  Granada: {
    mapEffect: null,
    interactions: [
      "Com Smoke ativa, causa só 2 de dano.",
      "Destrói a Smoke ativa.",
    ],
  },
  Smoke: {
    mapEffect: "Cobre a posição de quem jogou por 3 rounds.",
    interactions: [
      "Protege contra armas.",
      "Apaga e protege contra Molotov.",
      "Reduz o dano da Granada pela metade.",
      "É destruída por uma Granada.",
    ],
  },
  Molotov: {
    mapEffect: "Deixa fogo no alvo por 3 rounds.",
    interactions: ["Apagada por Smoke."],
  },
  Flashbang: {
    mapEffect: null,
    interactions: ["O oponente perde todas as ações na próxima rodada."],
  },
  Capacete: {
    mapEffect: null,
    interactions: ["Afeta apenas quem jogou."],
  },
  Colete: {
    mapEffect: null,
    interactions: ["Afeta apenas quem jogou."],
  },
};

export type CatalogEntry = Omit<Card, "id" | "team"> &
  CardRules & {
    id: string;
    teams: TeamName[];
  };

const merge = (pool: Omit<Card, "id">[], into: Map<string, CatalogEntry>) => {
  for (const card of pool) {
    const teams: TeamName[] =
      card.team === "shared" || !card.team ? ["police", "faction"] : [card.team];

    const existing = into.get(card.name);
    if (existing) {
      existing.teams = Array.from(new Set([...existing.teams, ...teams]));
      continue;
    }

    const { team: _team, ...rest } = card;
    into.set(card.name, {
      ...rest,
      id: card.name,
      teams,
      ...(CARD_RULES[card.name] ?? { mapEffect: null, interactions: [] }),
    });
  }
};

const buildCatalog = () => {
  const map = new Map<string, CatalogEntry>();
  merge(policeWeapons, map);
  merge(factionWeapons, map);
  merge(sharedUtilities, map);
  return Array.from(map.values());
};

export const CARD_CATALOG = buildCatalog();
