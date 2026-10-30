import { GameEngine } from "@/game/useGameEngine";
import { useGameTheme } from "@/game/useGameTheme";
import { Card } from "@/lib/types";
import { Plus } from "lucide-react";
import { NoirCard } from "@/components/art/noir-card";
import { HAND_CARD_DRAG } from "@/components/game/board-stage";

type InventoryProps = {
  game: GameEngine;
  type: "hand" | "warZone";
  length?: number;
};

export const CardComponent = ({
  card,
  game,
  placed = false,
}: {
  card: Card;
  game: GameEngine;
  placed?: boolean;
}) => {
  return (
    <div
      className={`aspect-[3/4] h-full max-w-full ${
        placed ? "drop-shadow-[0_8px_14px_rgba(0,0,0,0.8)]" : ""
      }`}
      style={card.style}
    >
      <NoirCard
        card={card}
        team={card.teamOwner || game.state.currentTeam}
        className="block w-full h-full"
      />
    </div>
  );
};

export const InventorySlot = ({
  index,
  game,
  type,
}: {
  index: number;
  game: GameEngine;
  type: "hand" | "warZone";
}) => {
  const theme = useGameTheme(game.state.currentTeam);

  const { currentTeam, turnPhase, tool, teams } = game.state;
  const inventory = teams[currentTeam].inventory[type];
  const card = inventory[index] as Card | null;

  const d6 = tool.result.d6 || -1;

  const canBuy =
    turnPhase === "BUYING" &&
    type === "hand" &&
    (inventory[index - 1] || index === 0) &&
    !card;

  const isPlacing = turnPhase === "PLACING" && type === "hand";

  const focused =
    d6 === index + 1 && type === "warZone" && turnPhase === "PLACING";

  const handleBuy = () => {
    if (!canBuy) return;
    game.dispatch({ type: "BUY_CARD" });
  };

  const handleSelectCard = () => {
    if (!card && d6 >= 0) return;

    if (turnPhase === "PLACING") {
      game.dispatch({
        type: "PLACE_CARD",
        payload: {
          cardIndex: index,
          positionIndex: d6 - 1,
        },
      });
    }
  };

  const handlePlayCard = () => {
    if (card && focused) {
      game.dispatch({
        type: "PLAY_CARD",
        payload: { card },
      });
    }
  };

  const baseSlotStyle =
    "aspect-[3/4] w-full  " +
    "bg-gradient-to-b  " +
    " border border-zinc-900 " +
    `${theme.overlay} ` +
    "rounded " +
    "shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] " +
    "flex flex-col items-center justify-center";

  const interactionStyle =
    card && turnPhase === "PLACING"
      ? "hover:brightness-125 cursor-pointer"
      : focused
        ? "cursor-default"
        : "opacity-50 hover:opacity-75";

  const ringStyle = canBuy
    ? "ring-2 ring-white "
    : isPlacing
      ? "ring-2 ring-white/70"
      : focused
        ? "ring-2 ring-white/90"
        : "";

  const animatedRingStyle =
    focused || isPlacing
      ? "animate-pulse"
      : canBuy
        ? "animate-pulse duration-500"
        : "";

  return (
    <button
      onClick={handleBuy}
      className={`group ${animatedRingStyle} ${
        canBuy ? "cursor-pointer" : "cursor-default animate-accordion-down"
      } ${theme.background}`}
    >
      <div
        onClick={type === "hand" ? handleSelectCard : handlePlayCard}
        // Na hora de posicionar, a carta pode ser arrastada até o slot no tabuleiro.
        draggable={isPlacing && !!card}
        onDragStart={(e) => {
          e.dataTransfer.setData(HAND_CARD_DRAG, String(index));
          e.dataTransfer.effectAllowed = "move";
        }}
        className={` ${baseSlotStyle} ${interactionStyle} ${ringStyle} ${
          isPlacing && card ? "cursor-grab active:cursor-grabbing" : ""
        }`}
      >
        {card ? (
          <CardComponent card={card} game={game} />
        ) : focused ? (
          <div className="text-white font-bold text-xs text-center">
            POSICIONE AQUI
          </div>
        ) : (
          <div className="text-zinc-700 text-xs">
            {canBuy ? (
              <Plus size={30} className="mx-auto text-zinc-500" />
            ) : (
              "VAZIO"
            )}
          </div>
        )}
      </div>
    </button>
  );
};

export const InventoryGrid = ({ game, type, length = 3 }: InventoryProps) => {
  return (
    <div
      className={`grid grid-cols-3 w-full ${
        type === "warZone" ? "gap-3 max-w-[400px] mx-auto" : "gap-4"
      }`}
    >
      {Array.from({ length }).map((_, i) => (
        <InventorySlot key={`inv-${i}`} game={game} type={type} index={i} />
      ))}
    </div>
  );
};
