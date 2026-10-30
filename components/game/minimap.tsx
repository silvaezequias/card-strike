"use client";

import { ReactNode } from "react";
import { TacticalBoard } from "@/components/art/tactical-board";

/** Borda externa dos tabuleiros: mais grossa e clara quando o minimapa está em hover. */
export const BOARD_EDGE =
  "transition-[stroke-width,stroke-opacity] duration-200 group-hover:[stroke-width:7] group-hover:[stroke-opacity:1]";

/** Qual tabuleiro está em destaque; o outro aparece no minimapa. */
export type MainBoardView = "cards" | "map";

/**
 * Minimapa: só o tabuleiro, sem moldura. As bordas acendem ao passar
 * o mouse; ao clicar, troca de lugar com o tabuleiro principal.
 */
export const MinimapButton = ({
  label,
  onClick,
  children,
  className = "",
}: {
  /** Nome para leitores de tela (ex.: "mapa"). */
  label: string;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) => (
  <button
    onClick={onClick}
    aria-label={`Ampliar ${label}`}
    // Botão não estica como div: a largura vem do contêiner.
    className={`group block w-full cursor-pointer ${className}`}
  >
    {/* No hover só a borda do tabuleiro (classe BOARD_EDGE) fica mais forte. */}
    <div className="pointer-events-none">{children}</div>
  </button>
);

/** Prévia do tabuleiro de cartas para o minimapa. */
export const CardBoardPreview = () => <TacticalBoard className="block w-full" />;
