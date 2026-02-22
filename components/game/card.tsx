import { GameEngine } from "@/game/useGameEngine";
import { useGameTheme } from "@/game/useGameTheme";
import { Card } from "@/lib/types";
import { Clock, Heart, Plus } from "lucide-react";

type InventoryProps = {
  game: GameEngine;
  type: "hand" | "warZone";
  length?: number;
};

export const CardStats = ({ card }: { card: Card }) => {
  const activeStats = [card.damage, card.healing, card.duration].filter(
    (val) => val > 0,
  ).length;

  const justify = activeStats > 1 ? "justify-between" : "justify-center";

  return (
    <div className={`flex items-center gap-1.5 mt-0.5 w-full ${justify}`}>
      {card.damage > 0 && (
        <div className="flex items-center gap-0.5">
          <Heart size={14} className="text-red-400" />
          <span className="text-sm font-bold text-red-400">-{card.damage}</span>
        </div>
      )}

      {card.healing > 0 && (
        <div className="flex items-center gap-0.5">
          <Heart size={14} className="text-green-400" />
          <span className="text-sm font-bold text-green-400">
            +{card.healing}
          </span>
        </div>
      )}

      {card.duration > 0 && (
        <div className="flex items-center gap-0.5">
          <Clock size={14} className="text-yellow-400" />
          <span className="text-sm font-bold text-yellow-400">
            {card.duration}
          </span>
        </div>
      )}
    </div>
  );
};

export const CardComponent = ({
  card,
  game,
}: {
  card: Card;
  game: GameEngine;
}) => {
  const theme = useGameTheme(game.state.currentTeam);

  const categoryStyle =
    card.cardCategory === "ARMA"
      ? "bg-red-500/20 text-red-300"
      : card.cardCategory === "BOMBA"
        ? "bg-orange-500/20 text-orange-300"
        : "bg-blue-500/20 text-blue-300";

  return (
    <div className="w-full h-full flex flex-col items-center justify-between gap-1 p-6">
      <span className={`text-[10px] font-bold px-1 rounded ${categoryStyle}`}>
        {card.cardCategory}
      </span>

      <div className="flex flex-col items-center gap-2">
        <span
          className={`${theme.text} font-bold text-center mt-0.5 leading-tight`}
        >
          {card.name}
        </span>
      </div>

      <CardStats card={card} />
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
    type === "hand" && (inventory[index - 1] || index === 0) && !card;

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

  const baseSlotStyle = `
    aspect-[3/4] w-full 
    bg-gradient-to-b 
    border border-zinc-900
    ${theme.overlay}
    rounded 
    shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]
    flex flex-col items-center justify-center
  `;

  const interactionStyle = card
    ? "hover:brightness-125 cursor-pointer"
    : focused
      ? "cursor-default"
      : "opacity-50 hover:opacity-75";

  const ringStyle = isPlacing
    ? "ring-2 ring-white/70 animate-pulse"
    : focused
      ? "ring-2 ring-white/90 animate-pulse"
      : "";

  return (
    <button
      onClick={handleBuy}
      className={`group ${
        canBuy ? "cursor-pointer" : "cursor-default"
      } ${theme.background}`}
    >
      <div
        onClick={handleSelectCard}
        className={`${baseSlotStyle} ${interactionStyle} ${ringStyle}`}
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
    <div className="grid grid-cols-3 gap-4 w-full">
      {Array.from({ length }).map((_, i) => (
        <InventorySlot key={`inv-${i}`} game={game} type={type} index={i} />
      ))}
    </div>
  );
};
