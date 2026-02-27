import { GameEngine } from "@/game/useGameEngine";
import { useGameTheme } from "@/game/useGameTheme";
import { Card } from "@/lib/types";
import { Clock, Heart, Plus } from "lucide-react";
import Image from "next/image";

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
  placed = false,
}: {
  card: Card;
  game: GameEngine;
  placed?: boolean;
}) => {
  const theme = useGameTheme(card.teamOwner || game.state.currentTeam);

  const cardIcons = {
    AWP: `/items/${card.teamOwner || game.state.currentTeam}/awp.svg`,
    "DESERT EAGLE": `/items/desert-eagle.svg`,
    GLOCK: `/items/faction/glock.svg`,
    USP: `/items/police/usp.svg`,
    "AK-47": `/items/faction/ak-47.svg`,
    BOMBA: `/items/c4.svg`,
    M4A1: `/items/police/m4a1.svg`,
    Granada: `/items/granade.svg`,
    Capacete: `/items/${card.teamOwner || game.state.currentTeam}/cap.svg`,
    Colete: `/items/${card.teamOwner || game.state.currentTeam}/bulletproof.svg`,
    Flashbang: `/items/flashbang.svg`,
    "KIT DEFUSE": "/items/kit-defuse.svg",
    Smoke: `/items/smoke.svg`,
  };

  const cardIcon = cardIcons[card.name as keyof typeof cardIcons];

  return (
    <div
      className={`
        ${theme.border} ${theme.background} border rounded-sm 
        aspect-[3/4] h-full flex flex-col items-center
        justify-center gap-1 p-4
      `}
      style={card.style}
    >
      {!placed && (
        <span
          className={`${theme.text} flex flex-col gap-5font-bold text-center mt-0.5 leading-tight text-base`}
        >
          {card.name}
        </span>
      )}

      {cardIcon && (
        <Image
          src={cardIcon}
          alt={card.name}
          width={placed ? 180 : 80}
          height={placed ? 80 : 40}
          className="mb-1"
        />
      )}
      {!placed && <CardStats card={card} />}
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
        className={` ${baseSlotStyle} ${interactionStyle} ${ringStyle} `}
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
