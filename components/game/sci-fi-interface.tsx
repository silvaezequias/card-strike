"use client";

import { useGameEngine } from "@/game/useGameEngine";
import type { GameTheme } from "@/lib/types";

import { GameOverOverlay } from "@/components/game/game-over-overlay";
import { FlyingCardsLayer } from "@/components/game/flying-cards-layer";
import { BurnedCardEffect } from "@/components/game/burned-card-effect";
import { PlayerCard } from "@/components/game/player-card";
import { MissionStatus } from "@/components/game/mission-status";
import { BombPanel } from "@/components/game/bomb-panel";
import { DeckPanel } from "@/components/game/deck-panel";
import { InventoryPanel } from "@/components/game/inventory-panel";
import { GameBoard } from "@/components/game/game-board";
import { RoundCountdown } from "@/components/game/round-countdown";
import { useEffect } from "react";
import { SetupSettings } from "@/game/game-types";
import { useGameTheme } from "@/game/useGameTheme";

export default function SciFiInterface({
  playerSetup,
}: {
  playerSetup: SetupSettings;
}) {
  const game = useGameEngine(playerSetup);

  const theme = useGameTheme(game.state.currentTeam);

  return (
    <div
      className={`min-h-screen ${theme.background}  flex flex-col items-center pt-14 p-4 overflow-hidden font-mono select-none relative transition-colors duration-700`}
    >
      {/* Round Countdown Overlay */}
      {game.state.turnPhase === "COUNTDOWN" && <RoundCountdown game={game} />}

      <div className="fixed top-0 left-0 right-0 z-50">
        <div
          className={`flex items-center justify-center gap-3 py-2 px-4 transition-all duration-700 ${
            theme.overlayScrim
          } backdrop-blur-sm`}
        >
          <div
            className={`w-2 h-2 rounded-full animate-pulse ${theme.teamBackground}`}
          />
          <span
            className={`text-xs font-bold tracking-[0.3em] uppercase ${
              theme.text
            }`}
          >
            Vez de {game.currentTeamName} - {game.currentPlayerName}
          </span>
          <div
            className={`w-2 h-2 rounded-full animate-pulse ${theme.teamBackground}`}
          />
        </div>
      </div>

      {/* <FlyingCardsLayer cards={game.flyingCards} /> */}
      <GameOverOverlay
        visible={"gameOver" in game}
        message="MISSAO FALHOU"
        subMessage={
          game.state.bomb.exploded
            ? `CARGA DETONADA NO SITE ${game.state.bomb.position}`
            : game.state.teams.police.health <= 0
              ? "FORCAS POLICIAIS ELIMINADAS"
              : "FACCAO ELIMINADA"
        }
        onRetry={() => window.location.reload()}
      />

      {/* <BurnedCardEffect card={game.burnedCard} /> */}

      <div
        className={`relative z-10 w-full max-w-7xl mx-auto flex flex-row items-start justify-center gap-8 md:gap-12`} //  ${game.isSlotModalOpen ? "transform-none" : "scale-[0.8] md:scale-100 transition-transform duration-500"}`}
      >
        {/* Left Column: Police + Mission */}
        <div className="order-1 flex-shrink-0 flex flex-col gap-4 mt-2">
          <PlayerCard game={game} alignment="left" />
          <MissionStatus game={game} />
        </div>

        {/* Center: Game Board */}
        <div className="order-2">
          <GameBoard game={game} />
        </div>

        {/* Right Column: Faction + Bomb + Deck */}
        <div className="order-3 flex-shrink-0 flex flex-col gap-4 mt-2">
          <PlayerCard game={game} alignment="right" />
          <BombPanel game={game} />
          <DeckPanel game={game} onDraw={() => {}} disabled={true} />
        </div>
      </div>

      <InventoryPanel game={game} />
    </div>
  );
}
