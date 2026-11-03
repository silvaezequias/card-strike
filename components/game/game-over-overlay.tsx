"use client";

import { Skull, Trophy } from "lucide-react";
import { getPalette } from "@/components/art/palette";
import { TeamName } from "@/game/game-types";

const TEAM_NAME: Record<TeamName, string> = { police: "Militar", faction: "Terrorista" };

/**
 * Fim de partida. Vitória na cor do time vencedor; derrota (só para quem
 * joga contra o bot e perde) em vermelho, como "missão falhou".
 */
export const GameOverOverlay = ({
  visible,
  winner,
  defeat,
  winnerName,
  subMessage,
  onRetry,
  retryLabel,
}: {
  visible: boolean;
  winner: TeamName;
  /** Quem está jogando perdeu (partida contra o bot). */
  defeat: boolean;
  winnerName: string;
  subMessage: string;
  onRetry: () => void;
  retryLabel?: string;
}) => {
  if (!visible) return null;
  const p = getPalette(winner);
  const color = defeat ? "#dc2626" : p.rim;
  const glow = defeat ? "rgba(220,38,38,0.8)" : p.glow;

  return (
    <div className="absolute inset-0 z-[100] bg-black/80 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-1000">
      <div className="text-center">
        {defeat ? (
          <Skull size={100} className="mx-auto mb-4 animate-pulse" style={{ color }} />
        ) : (
          <Trophy size={100} className="mx-auto mb-4 animate-pulse" style={{ color, filter: `drop-shadow(0 0 18px ${glow})` }} />
        )}
        <h1 className="text-6xl font-black tracking-widest" style={{ color, filter: `drop-shadow(0 0 20px ${glow})` }}>
          {defeat ? "MISSÃO FALHOU" : "VITÓRIA"}
        </h1>
        {!defeat && (
          <p className="mt-3 text-2xl font-black uppercase tracking-[0.25em] text-white">
            {winnerName} · {TEAM_NAME[winner]}
          </p>
        )}
        <p className="text-zinc-400 mt-4 text-xl tracking-widest">{subMessage}</p>
        <button
          onClick={onRetry}
          className="mt-8 px-8 py-3 text-white rounded border-2 bg-black/60 font-bold tracking-widest transition-[filter] hover:brightness-125"
          style={{ borderColor: color, boxShadow: `0 0 18px ${glow}` }}
        >
          {retryLabel ?? (defeat ? "TENTAR NOVAMENTE" : "JOGAR NOVAMENTE")}
        </button>
      </div>
    </div>
  );
};
