"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NoirCardBack } from "@/components/art/noir-card";
import { opponentOf } from "@/game/card-effects";
import { TeamName } from "@/game/game-types";
import { GameEngine } from "@/game/useGameEngine";

/* ═══════════════════════════════════════════════
   DISTRIBUIÇÃO INICIAL
   No começo da partida as mãos estão vazias: três
   cartas saem do baralho de cada time, alternando,
   e voam até a mão de quem joga ou até o cartão do
   outro jogador no topo. A carta entra na mão quando
   pousa.
   ═══════════════════════════════════════════════ */

const CARDS_PER_TEAM = 3;
/** Espera a câmera abrir a mesa e a mão subir. */
const DEAL_START_MS = 1000;
const DEAL_GAP_MS = 420;
const FLIGHT_MS = 900;
const END_PAUSE_MS = 500;
const CARD_W = 84;
const CARD_H = (CARD_W * 4) / 3;

type Point = { x: number; y: number };
type Flight = { id: number; team: TeamName; from: Point; to: Point; scale: number };

const centerOf = (el: Element | null): Point | null => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

const FlyingCard = ({ flight, onLand }: { flight: Flight; onLand: () => void }) => {
  const ref = useRef<HTMLDivElement>(null);
  const landRef = useRef(onLand);
  landRef.current = onLand;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { from, to, scale } = flight;
    const mid = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - 120 };
    const spin = flight.team === "police" ? -1 : 1;
    const at = (p: Point, s: number, r: number) =>
      `translate(${p.x - CARD_W / 2}px, ${p.y - CARD_H / 2}px) rotate(${r}deg) scale(${s})`;
    const animation = el.animate(
      [
        { transform: at(from, 0.45, spin * 25), opacity: 0 },
        { transform: at(from, 0.6, spin * 20), opacity: 1, offset: 0.12 },
        { transform: at(mid, 1.15, spin * 8), offset: 0.55 },
        { transform: at(to, scale, 0), opacity: 1 },
      ],
      { duration: FLIGHT_MS, easing: "cubic-bezier(0.3, 0.6, 0.3, 1)", fill: "forwards" },
    );
    animation.onfinish = () => landRef.current();
    return () => animation.cancel();
    // Cada carta voa uma vez só.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed left-0 top-0 drop-shadow-[0_14px_18px_rgba(0,0,0,0.8)]"
      style={{ width: CARD_W, height: CARD_H, opacity: 0 }}
    >
      <NoirCardBack team={flight.team} className="block h-full w-full" />
    </div>
  );
};

export const DealLayer = ({ game, handTeam }: { game: GameEngine; handTeam: TeamName }) => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const gameRef = useRef(game);
  gameRef.current = game;

  useEffect(() => {
    const first = gameRef.current.state.currentTeam;
    const order = Array.from({ length: CARDS_PER_TEAM * 2 }, (_, i) => (i % 2 === 0 ? first : opponentOf(first)));
    const dealtToHand = { count: 0 };

    const timers = order.map((team, i) =>
      window.setTimeout(() => {
        const from =
          centerOf(document.querySelector(`[data-deck-anchor="${team}"]`)) ??
          { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        // Na mão: cada carta vai para o seu espaço; senão, para o cartão do jogador.
        let to: Point | null = null;
        let scale = 0.5;
        if (team === handTeam) {
          const slot = document.querySelectorAll("[data-hand-anchor] .grid > *")[dealtToHand.count++];
          to = centerOf(slot ?? null);
          if (slot) scale = slot.getBoundingClientRect().width / CARD_W;
        }
        to ??=
          centerOf(document.querySelector(`[data-player-anchor="${team}"]`)) ??
          { x: from.x, y: window.innerHeight };

        setFlights((current) => [...current, { id: i, team, from, to: to!, scale }]);
      }, DEAL_START_MS + i * DEAL_GAP_MS),
    );

    const end = window.setTimeout(
      () => gameRef.current.finishDeal(),
      DEAL_START_MS + (order.length - 1) * DEAL_GAP_MS + FLIGHT_MS + END_PAUSE_MS,
    );

    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(end);
    };
    // Distribui uma vez, no começo da partida.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const land = (flight: Flight) => {
    gameRef.current.dispatch({ type: "DEAL_CARD", payload: { team: flight.team } });
    setFlights((current) => current.filter((f) => f.id !== flight.id));
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-[80]">
      {flights.map((flight) => (
        <FlyingCard key={flight.id} flight={flight} onLand={() => land(flight)} />
      ))}
    </div>
  );
};
