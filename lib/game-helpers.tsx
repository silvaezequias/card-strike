import { TeamName } from "@/game/game-types";
import type { Card, Rotation } from "@/lib/types";

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export const getD6Rotation = (val: number): Rotation => {
  switch (val) {
    case 1:
      return { x: 0, y: 0, z: 0 };
    case 6:
      return { x: 180, y: 0, z: 0 };
    case 2:
      return { x: -90, y: 0, z: 0 };
    case 5:
      return { x: 90, y: 0, z: 0 };
    case 3:
      return { x: 0, y: -90, z: 0 };
    case 4:
      return { x: 0, y: 90, z: 0 };
    default:
      return { x: 0, y: 0, z: 0 };
  }
};

export const getSpinnerRotation = (val: string): Rotation => {
  if (val === "A") return { x: 0, y: 0, z: 0 };
  if (val === "B") return { x: 0, y: 0, z: -120 };
  if (val === "C") return { x: 0, y: 0, z: -240 };
  return { x: 0, y: 0, z: 0 };
};

/* ═══════════════════════════════════════════════
   CARD POOLS
   ═══════════════════════════════════════════════ */

const policeWeapons: Omit<Card, "id">[] = [
  {
    type: "item",
    cardCategory: "BOMBA",
    isOffensive: false,
    name: "KIT DEFUSE",
    description: "Desarma a bomba plantada. Uso unico.",
    damage: 0,
    healing: 0,
    duration: 0,
    team: "police",
  },
  {
    type: "item",
    cardCategory: "ARMA",
    isOffensive: true,
    name: "M4A1",
    description: "Rifle tatico da policia. Dano moderado.",
    damage: 3,
    healing: 0,
    duration: 0,
    team: "police",
  },
  {
    type: "item",
    cardCategory: "ARMA",
    isOffensive: true,
    name: "USP",
    description: "Pistola silenciada. Dano leve.",
    damage: 2,
    healing: 0,
    duration: 0,
    team: "police",
  },
  {
    type: "item",
    cardCategory: "ARMA",
    isOffensive: true,
    name: "DESERT EAGLE",
    description: "Pistola poderosa de alto calibre.",
    damage: 5,
    healing: 0,
    duration: 0,
    team: "police",
  },
  {
    type: "item",
    cardCategory: "ARMA",
    isOffensive: true,
    name: "AWP",
    description: "Sniper devastadora. Dano massivo.",
    damage: 8,
    healing: 0,
    duration: 0,
    team: "police",
  },
];

const factionWeapons: Omit<Card, "id">[] = [
  {
    type: "item",
    cardCategory: "ARMA",
    isOffensive: true,
    name: "AK-47",
    description: "Rifle de assalto da faccao. Dano moderado.",
    damage: 3,
    healing: 0,
    duration: 0,
    team: "faction",
  },
  {
    type: "item",
    cardCategory: "ARMA",
    isOffensive: true,
    name: "GLOCK",
    description: "Pistola basica da faccao. Dano leve.",
    damage: 2,
    healing: 0,
    duration: 0,
    team: "faction",
  },
  {
    type: "item",
    cardCategory: "ARMA",
    isOffensive: true,
    name: "DESERT EAGLE",
    description: "Pistola poderosa de alto calibre.",
    damage: 5,
    healing: 0,
    duration: 0,
    team: "faction",
  },
  {
    type: "item",
    cardCategory: "ARMA",
    isOffensive: true,
    name: "AWP",
    description: "Sniper devastadora. Dano massivo.",
    damage: 8,
    healing: 0,
    duration: 0,
    team: "faction",
  },
  {
    type: "item",
    cardCategory: "BOMBA",
    isOffensive: true,
    name: "BOMBA",
    description: "Plante no bombsite. Explode em 5 rounds (10 dano).",
    damage: 10,
    healing: 0,
    duration: 5,
    team: "faction",
  },
];

const sharedUtilities: Omit<Card, "id">[] = [
  {
    type: "utility",
    cardCategory: "DIVERSOS",
    isOffensive: true,
    name: "Granada",
    description: "4 dano (2 se smoke ativo). Destroi smoke.",
    damage: 4,
    healing: 0,
    duration: 0,
    team: "shared",
  },
  {
    type: "utility",
    cardCategory: "DIVERSOS",
    isOffensive: false,
    name: "Smoke",
    description: "Protege de arma, molotov e dano total de granada. 3 rounds.",
    damage: 0,
    healing: 0,
    duration: 3,
    team: "shared",
  },
  {
    type: "utility",
    cardCategory: "DIVERSOS",
    isOffensive: true,
    name: "Molotov",
    description:
      "Queima o inimigo. 1 dano/round por 3 rounds. Apagada por smoke.",
    damage: 1,
    healing: 0,
    duration: 3,
    team: "shared",
  },
  {
    type: "utility",
    cardCategory: "DIVERSOS",
    isOffensive: true,
    name: "Flashbang",
    description: "Impede qualquer acao do oponente por 1 rodada.",
    damage: 0,
    healing: 0,
    duration: 1,
    team: "shared",
  },
  {
    type: "utility",
    cardCategory: "DIVERSOS",
    isOffensive: false,
    name: "Capacete",
    description: "Protege quem jogou. +2 vida.",
    damage: 0,
    healing: 2,
    duration: 0,
    team: "shared",
  },
  {
    type: "utility",
    cardCategory: "DIVERSOS",
    isOffensive: false,
    name: "Colete",
    description: "Protege quem jogou. +4 vida.",
    damage: 0,
    healing: 4,
    duration: 0,
    team: "shared",
  },
];

/* ═══════════════════════════════════════════════
   RANDOM CARD GENERATOR
   ═══════════════════════════════════════════════ */

export const generateRandomCard = (team: TeamName): Card => {
  const teamWeapons = team === "police" ? policeWeapons : factionWeapons;
  const pool = [...teamWeapons, ...sharedUtilities];

  const chosen = pool[Math.floor(Math.random() * pool.length)];
  return { id: Date.now() + Math.random(), ...chosen };
};
