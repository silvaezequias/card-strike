"use client";

import type { Card } from "@/lib/types";

export const FlyingCardsLayer = ({ cards }: { cards: Card[] }) => (
  <>
    {cards.map((card) => (
      <div
        key={card.flyId}
        className="fixed z-[80] w-24 aspect-[3/4] bg-gradient-to-br from-slate-800 to-black rounded-lg border-2 border-white/50 shadow-2xl flex flex-col items-center justify-center pointer-events-none animate-draw-to-hand"
        style={{ top: "50%", right: "15%" }}
      >
        <div className={`scale-75 ${card.color}`}>{card.icon}</div>
      </div>
    ))}
  </>
);
