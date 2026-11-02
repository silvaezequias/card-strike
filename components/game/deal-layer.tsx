"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NoirCard, NoirCardBack } from "@/components/art/noir-card";
import { Card } from "@/lib/types";
import { opponentOf } from "@/game/card-effects";
import { TeamName } from "@/game/game-types";
import { GameEngine } from "@/game/useGameEngine";

/* ═══════════════════════════════════════════════
   DISTRIBUIÇÃO INICIAL
   No começo da partida as mãos estão vazias: três
   cartas saem do baralho de cada time, alternando,
   e voam de costas até a mão de quem joga ou até o
   cartão do outro jogador no topo. Na mão, a carta
   vira em 3D no lugar dela: gira até ficar de lado,
   entra na mão e termina a virada já de frente, com
   um pequeno encaixe.
   ═══════════════════════════════════════════════ */

const CARDS_PER_TEAM = 3;
/** Espera a câmera abrir a mesa e a mão subir. */
const DEAL_START_MS = 1000;
const DEAL_GAP_MS = 420;
const FLIGHT_MS = 900;
const END_PAUSE_MS = 500;
/** Primeira metade da virada (costas até ficar de lado). */
const FLIP_OUT_MS = 170;
/** Segunda metade (de lado até a frente) com o encaixe. */
const FLIP_IN_MS = 300;
const CARD_W = 84;
const CARD_H = (CARD_W * 4) / 3;

type Point = { x: number; y: number };
type Flight = {
  id: number;
  team: TeamName;
  from: Point;
  to: Point;
  scale: number;
  /** Posição na mão de quem joga; null quando vai para o cartão do oponente (sem virar). */
  handIndex: number | null;
};

const centerOf = (el: Element | null): Point | null => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

const FlyingCard = ({
  flight,
  face,
  onLand,
  onDone,
}: {
  flight: Flight;
  /** Carta já na mão (depois de onLand): a frente que aparece na virada. */
  face: Card | null;
  onLand: () => void;
  onDone: () => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const flipRef = useRef<HTMLDivElement>(null);
  const handlers = useRef({ onLand, onDone });
  handlers.current = { onLand, onDone };
  const flips = flight.handIndex !== null;

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
    let flipOut: Animation | null = null;
    animation.onfinish = () => {
      if (!flips || !flipRef.current) {
        handlers.current.onLand();
        handlers.current.onDone();
        return;
      }
      // Gira as costas até ficar de lado; aí a carta entra na mão.
      flipOut = flipRef.current.animate(
        [{ transform: "rotateY(0deg) translateZ(0px)" }, { transform: "rotateY(90deg) translateZ(18px)" }],
        { duration: FLIP_OUT_MS, easing: "cubic-bezier(0.5, 0, 1, 1)", fill: "forwards" },
      );
      flipOut.onfinish = () => handlers.current.onLand();
    };
    return () => {
      animation.cancel();
      flipOut?.cancel();
    };
    // Cada carta voa uma vez só.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Com a frente pronta, termina a virada e encaixa no lugar.
  useLayoutEffect(() => {
    if (!face || !flipRef.current) return;
    const flipIn = flipRef.current.animate(
      [
        { transform: "rotateY(-90deg) translateZ(18px) scale(1.06)" },
        { transform: "rotateY(8deg) translateZ(6px) scale(1.08)", offset: 0.6 },
        { transform: "rotateY(0deg) translateZ(0px) scale(1)" },
      ],
      { duration: FLIP_IN_MS, easing: "cubic-bezier(0, 0, 0.3, 1)", fill: "forwards" },
    );
    flipIn.onfinish = () => handlers.current.onDone();
    return () => flipIn.cancel();
  }, [face]);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed left-0 top-0 drop-shadow-[0_14px_18px_rgba(0,0,0,0.8)]"
      style={{ width: CARD_W, height: CARD_H, opacity: 0, perspective: 700 }}
    >
      <div ref={flipRef} className="h-full w-full" style={{ transformStyle: "preserve-3d" }}>
        {face ? (
          <NoirCard card={face} team={flight.team} className="block h-full w-full" />
        ) : (
          <NoirCardBack team={flight.team} className="block h-full w-full" />
        )}
      </div>
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
        let handIndex: number | null = null;
        if (team === handTeam) {
          handIndex = dealtToHand.count++;
          const slot = document.querySelectorAll("[data-hand-anchor] .grid > *")[handIndex];
          to = centerOf(slot ?? null);
          if (slot) scale = slot.getBoundingClientRect().width / CARD_W;
        }
        to ??=
          centerOf(document.querySelector(`[data-player-anchor="${team}"]`)) ??
          { x: from.x, y: window.innerHeight };

        setFlights((current) => [...current, { id: i, team, from, to: to!, scale, handIndex }]);
      }, DEAL_START_MS + i * DEAL_GAP_MS),
    );

    const end = window.setTimeout(
      () => gameRef.current.finishDeal(),
      DEAL_START_MS + (order.length - 1) * DEAL_GAP_MS + FLIGHT_MS + FLIP_OUT_MS + FLIP_IN_MS + END_PAUSE_MS,
    );

    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(end);
    };
    // Distribui uma vez, no começo da partida.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A carta entra na mão quando pousa (de lado, no meio da virada); a animada
  // só sai depois de terminar a virada por cima da carta de verdade.
  const [landed, setLanded] = useState<Set<number>>(new Set());
  const land = (flight: Flight) => {
    gameRef.current.dispatch({ type: "DEAL_CARD", payload: { team: flight.team } });
    setLanded((current) => new Set(current).add(flight.id));
  };
  const done = (flight: Flight) => setFlights((current) => current.filter((f) => f.id !== flight.id));
  const hand = game.state.teams[handTeam].inventory.hand;

  return (
    <div className="pointer-events-none fixed inset-0 z-[80]">
      {flights.map((flight) => (
        <FlyingCard
          key={flight.id}
          flight={flight}
          face={flight.handIndex !== null && landed.has(flight.id) ? (hand[flight.handIndex] ?? null) : null}
          onLand={() => land(flight)}
          onDone={() => done(flight)}
        />
      ))}
    </div>
  );
};
