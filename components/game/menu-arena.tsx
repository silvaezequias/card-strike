"use client";

import { factionPalette, policePalette } from "@/components/art/palette";
import { TacticalBoard } from "@/components/art/tactical-board";

/** Arena ao fundo: o tabuleiro tático deitado como chão, com luzes dos dois times. */
export const Arena = ({ dim }: { dim: boolean }) => (
  <div className={`pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-500 ${dim ? "opacity-40" : ""}`}>
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,#1d1838_0%,#0b0916_55%,#050409_100%)]" />
    {/* Feixes de luz das bases */}
    <div
      className="absolute -left-1/4 top-0 h-[120%] w-1/2 rotate-[18deg] opacity-25 blur-3xl"
      style={{ background: `linear-gradient(180deg, ${policePalette.glow}, transparent 70%)` }}
    />
    <div
      className="absolute -right-1/4 top-0 h-[120%] w-1/2 -rotate-[18deg] opacity-25 blur-3xl"
      style={{ background: `linear-gradient(180deg, ${factionPalette.glow}, transparent 70%)` }}
    />
    {/* Chão: o tabuleiro em perspectiva */}
    <div className="absolute inset-x-0 bottom-0 h-[62%]" style={{ perspective: 900 }}>
      <div
        className="absolute left-1/2 top-[6%] w-[150%] -translate-x-1/2 opacity-45"
        style={{ transform: "translateX(-50%) rotateX(64deg)", transformOrigin: "50% 0%" }}
      >
        <TacticalBoard className="block h-auto w-full" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#050409] via-transparent to-[#050409]/80" />
    </div>
    {/* Poeira e vinheta */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,transparent_40%,rgba(0,0,0,0.75)_100%)]" />
  </div>
);
