"use client";

import { useGameTheme } from "@/game/useGameTheme";
import { Card } from "@/lib/types";
import { DICE_REST_MS, DiceRoll } from "@/components/game/board-dice";

/**
 * Resultado do dado no topo da tela enquanto ele está parado na mesa:
 * quem tirou quanto e o que acontece no slot sorteado.
 */
export const DiceResult = ({
  roll,
  playerName,
  card,
}: {
  roll: DiceRoll;
  playerName: string;
  /** Carta já no slot sorteado, se houver. */
  card: Card | null | undefined;
}) => {
  const theme = useGameTheme(roll.team);

  return (
    <div
      key={roll.id}
      className="turn-banner pointer-events-none fixed inset-x-0 top-9 z-40 flex justify-center"
      // Some junto com o dado.
      style={{ animationDuration: `${DICE_REST_MS}ms` }}
    >
      <div className="bg-gradient-to-r from-transparent via-black/80 to-transparent px-32 py-2 text-center">
        <p className={`text-2xl font-black uppercase tracking-[0.2em] drop-shadow-lg ${theme.text}`}>
          {playerName} tirou {roll.value}
        </p>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-300">
          {card
            ? `Slot ${roll.value}: ${card.name} pode ser jogada`
            : `Slot ${roll.value} vazio: hora de posicionar uma carta`}
        </p>
      </div>
    </div>
  );
};
