"use client";

import { Flame } from "lucide-react";
import type { Card } from "@/lib/types";

export const BurnedCardEffect = ({ card }: { card: Card | null }) => {
  if (!card) return null;
  return (
    <div
      className="fixed z-[90] w-24 aspect-[3/4] bg-red-900/80 rounded-lg border-2 border-red-500 shadow-[0_0_30px_red] flex flex-col items-center justify-center pointer-events-none animate-ping"
      style={{ top: "90%", left: "50%", transform: "translate(-50%, -50%)" }}
    >
      <Flame size={32} className="text-white" />
      <div className="text-[8px] font-bold text-white mt-1">{"MÃO CHEIA"}</div>
    </div>
  );
};
