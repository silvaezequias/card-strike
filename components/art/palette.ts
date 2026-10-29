import { TeamName } from "@/game/game-types";

/* ═══════════════════════════════════════════════
   NOIR PALETTE
   Ilustração flat com luz de recorte (rim light)
   colorida, sombras profundas e faixas de luz.
   ═══════════════════════════════════════════════ */

export type ArtPalette = {
  team: TeamName;

  bg0: string;
  bg1: string;
  bg2: string;
  streak: string;
  glow: string;
  rim: string;
  accent: string;

  metalDark: string;
  metal: string;
  metalLight: string;

  clothDark: string;
  cloth: string;
  clothLight: string;

  woodDark: string;
  wood: string;

  skinShade: string;
  skin: string;
  skinLight: string;
  hair: string;
  lip: string;
  eye: string;
};

export const policePalette: ArtPalette = {
  team: "police",

  bg0: "#04060e",
  bg1: "#0b1330",
  bg2: "#1a2a6e",
  streak: "#3d6dff",
  glow: "#2f7dff",
  rim: "#86e3ff",
  accent: "#4da3ff",

  metalDark: "#0c0f1d",
  metal: "#1f2642",
  metalLight: "#3b4877",

  clothDark: "#0d1426",
  cloth: "#1b2847",
  clothLight: "#30467a",

  woodDark: "#3a2a3a",
  wood: "#5c4256",

  skinShade: "#6e4f7e",
  skin: "#c38f8c",
  skinLight: "#f0c4b2",
  hair: "#100f1a",
  lip: "#93566a",
  eye: "#0a0a14",
};

export const factionPalette: ArtPalette = {
  team: "faction",

  bg0: "#0c0206",
  bg1: "#2a0613",
  bg2: "#5e0f28",
  streak: "#ff2d5a",
  glow: "#ff2448",
  rim: "#ff8197",
  accent: "#ff4d5e",

  metalDark: "#13080d",
  metal: "#2c1820",
  metalLight: "#52303f",

  clothDark: "#1a0c10",
  cloth: "#36201f",
  clothLight: "#5a3833",

  woodDark: "#4a1d18",
  wood: "#7e3524",

  skinShade: "#753650",
  skin: "#c27d74",
  skinLight: "#f2b39b",
  hair: "#14080b",
  lip: "#87353f",
  eye: "#100508",
};

export const getPalette = (team: TeamName) =>
  team === "police" ? policePalette : factionPalette;
