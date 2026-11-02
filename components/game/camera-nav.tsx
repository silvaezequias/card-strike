"use client";

import { Eye, LayoutGrid, Map as MapIcon, Swords } from "lucide-react";
import { ReactNode } from "react";
import { opponentOf } from "@/game/card-effects";
import { TeamName } from "@/game/game-types";
import { CardCameraFocus } from "./board-stage";
import { Bombsite, MapCameraFocus } from "./map-board";

/** Enquadramento escolhido pelo jogador nos botões do topo. */
export type CameraView =
  | { board: "cards"; area: "overview" | "mine" | "enemy" }
  | { board: "map"; area: "full" | Bombsite };

export const cardCameraFocus = (view: CameraView | null, me: TeamName): CardCameraFocus | null => {
  if (view?.board !== "cards") return null;
  if (view.area === "overview") return { area: "overview", plain: true };
  return { area: "grid", team: view.area === "mine" ? me : opponentOf(me), plain: true };
};

export const mapCameraFocus = (view: CameraView | null): MapCameraFocus | null =>
  view?.board === "map" ? { area: view.area, plain: true } : null;

const SITES: Bombsite[] = ["A", "B", "C"];

const NavButton = ({
  active,
  activeClass,
  onClick,
  children,
}: {
  active: boolean;
  activeClass: string;
  onClick: () => void;
  children: ReactNode;
}) => (
  <button
    onClick={onClick}
    aria-pressed={active}
    className={`flex items-center gap-1.5 whitespace-nowrap px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors ${
      active ? `${activeClass} bg-white/10` : "text-white/60 hover:bg-white/5 hover:text-white"
    }`}
  >
    {children}
  </button>
);

/** Atalhos de câmera: partes do tabuleiro de cartas e do mapa. */
export const CameraNav = ({
  board,
  view,
  activeClass,
  onSelect,
}: {
  /** Tabuleiro em tela: só os atalhos dele aparecem. */
  board: CameraView["board"];
  view: CameraView | null;
  activeClass: string;
  onSelect: (view: CameraView) => void;
}) => {
  const button = (target: CameraView, children: ReactNode) => (
    <NavButton
      key={target.area}
      active={view?.board === target.board && view.area === target.area}
      activeClass={activeClass}
      onClick={() => onSelect(target)}
    >
      {children}
    </NavButton>
  );

  return (
    <nav
      aria-label="Câmera"
      className="flex overflow-hidden rounded-lg border border-white/10 bg-black/60 backdrop-blur"
    >
      {board === "cards" ? (
        <>
          {button({ board: "cards", area: "overview" }, <><Eye size={12} /> Geral</>)}
          {button({ board: "cards", area: "mine" }, <><LayoutGrid size={12} /> Minhas cartas</>)}
          {button({ board: "cards", area: "enemy" }, <><Swords size={12} /> Inimigo</>)}
        </>
      ) : (
        <>
          {button({ board: "map", area: "full" }, <><MapIcon size={12} /> Mapa</>)}
          {SITES.map((site) => button({ board: "map", area: site }, site))}
        </>
      )}
    </nav>
  );
};
