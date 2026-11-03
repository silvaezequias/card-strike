import { TeamName } from "@/game/game-types";

/* ═══════════════════════════════════════════════
   PERSONAGENS
   Artes vetorizadas (public/art/characters), limpas
   e recortadas pela silhueta. Todas no mesmo quadro:
   400 de largura, cabeça a partir de y 36 e botas
   em y 892. A pose já olha para o centro da tela
   (Militar para a direita, Terrorista para a esquerda).
   ═══════════════════════════════════════════════ */

export const ART_WIDTH = 400;
export const ART_HEIGHT = 920;

export type CharacterArt = {
  src: string;
  /** Centro da cabeça em x, para os recortes de rosto e busto. */
  headX: number;
};

export const TEAM_CHARACTERS: Record<TeamName, [CharacterArt, CharacterArt]> = {
  police: [
    { src: "/art/characters/police.svg", headX: 202 },
    { src: "/art/characters/police-2.svg", headX: 150 },
  ],
  faction: [
    { src: "/art/characters/faction.svg", headX: 218 },
    { src: "/art/characters/faction-2.svg", headX: 196 },
  ],
};

/** Recortes do quadro do personagem (viewBox), a partir da cabeça. */
export const characterCrop = (art: CharacterArt, crop: "bust" | "head" | "card" | "full") => {
  switch (crop) {
    case "head":
      return { x: art.headX - 66, y: 24, w: 132, h: 132 };
    case "bust":
      return { x: art.headX - 140, y: 18, w: 280, h: 350 };
    case "card":
      return { x: art.headX - 150, y: 12, w: 300, h: 400 };
    case "full":
      return { x: 0, y: 14, w: ART_WIDTH, h: 890 };
  }
};

/** A arte do personagem como imagem dentro de um SVG (quadro 400 × 920). */
export const CharacterImage = ({ art }: { art: CharacterArt }) => (
  <image href={art.src} x={0} y={0} width={ART_WIDTH} height={ART_HEIGHT} preserveAspectRatio="xMidYMin meet" />
);
