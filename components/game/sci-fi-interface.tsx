"use client";

import { useGameEngine } from "@/game/useGameEngine";

import { GameOverOverlay } from "@/components/game/game-over-overlay";
import { PlayerCard } from "@/components/game/player-card";
import { MissionStatus } from "@/components/game/mission-status";
import { BombPanel } from "@/components/game/bomb-panel";
import { DeckPanel } from "@/components/game/deck-panel";
import { InventoryPanel } from "@/components/game/inventory-panel";
import { RoundCountdown } from "@/components/game/round-countdown";
import { Action } from "@/components/game/action";
import { BoardStage } from "@/components/game/board-stage";
import { CSSProperties, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Ban } from "lucide-react";
import { useFitScale } from "@/game/useFitScale";
import { SetupSettings, TBoardTabs, TeamName } from "@/game/game-types";
import { useGameTheme } from "@/game/useGameTheme";
import { MapSpot } from "@/components/art/tactical-board";
import { Card } from "@/lib/types";

/** Coluna lateral que encolhe para caber na altura da tela. */
const FitColumn = ({
  children,
  onScale,
}: {
  children: ReactNode;
  onScale?: (scale: number) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const fit = useFitScale(ref, { reserveTop: 56, reserveBottom: 56, reserveX: 0, minScale: 0.45 });

  useEffect(() => onScale?.(fit.scale), [fit.scale, onScale]);

  return (
    <div
      className="relative z-20 flex-shrink-0"
      style={{
        width: fit.width ? fit.width * fit.scale : undefined,
        height: fit.height ? fit.height * fit.scale : undefined,
      }}
    >
      <div
        ref={ref}
        className="flex w-max flex-col gap-4 origin-top-left"
        style={{ transform: `scale(${fit.scale})` }}
      >
        {children}
      </div>
    </div>
  );
};

/** Altura do inventário aberto (antes da escala) e folga sob o tabuleiro. */
const INVENTORY_OPEN_HEIGHT = 258;
const BOARD_BOTTOM_GAP = 48;

const TABS: { id: TBoardTabs; label: string }[] = [
  { id: "battlefieldTab", label: "Campo de Batalha" },
  { id: "actionTab", label: "Ação" },
];

export default function SciFiInterface({
  playerSetup,
}: {
  playerSetup: SetupSettings;
}) {
  const game = useGameEngine(playerSetup);
  const { state, dispatch } = game;
  const { currentTeam, turnPhase, teams, board } = state;

  const theme = useGameTheme(currentTeam);
  const [fit, setFit] = useState(1);

  /* ───────── Tabuleiro ───────── */

  const positions: Record<TeamName, MapSpot> = {
    police: teams.police.position ?? "BASE",
    faction: teams.faction.position ?? "BASE",
  };

  // Enquanto um peão anda, a câmera mostra o mapa.
  const [pawnWalking, setPawnWalking] = useState(false);
  const lastPositions = useRef(positions);
  useEffect(() => {
    const prev = lastPositions.current;
    if (prev.police !== positions.police || prev.faction !== positions.faction) {
      setPawnWalking(true);
    }
    lastPositions.current = positions;
  }, [positions.police, positions.faction]);

  const handlePawnArrive = useCallback(() => {
    window.setTimeout(() => setPawnWalking(false), 500);
  }, []);

  // Carta jogada: a câmera abre para mostrar o voo até a zona de combate.
  const [cardFlying, setCardFlying] = useState(false);
  const playedCount = state.playedCards.length;
  const lastPlayedCount = useRef(playedCount);
  useEffect(() => {
    if (playedCount <= lastPlayedCount.current) {
      lastPlayedCount.current = playedCount;
      return;
    }
    lastPlayedCount.current = playedCount;
    setCardFlying(true);
    const timer = window.setTimeout(() => setCardFlying(false), 1900);
    return () => window.clearTimeout(timer);
  }, [playedCount]);

  const shot = pawnWalking || cardFlying || turnPhase === "COUNTDOWN" ? "overview" : "focus";

  const slots: Record<TeamName, (Card | null)[]> = {
    police: teams.police.inventory.warZone,
    faction: teams.faction.inventory.warZone,
  };

  const lastPlayed = state.playedCards[state.playedCards.length - 1];
  const combatCard = lastPlayed
    ? { card: lastPlayed, team: lastPlayed.teamOwner ?? currentTeam }
    : null;

  const d6 = state.tool.result.d6;
  const highlight =
    turnPhase === "PLACING" && d6 ? { team: currentTeam, index: d6 - 1 } : null;

  // Clicar na carta do slot sorteado joga a carta (vai para a zona de combate).
  const handleSlotClick = (team: TeamName, index: number) => {
    const card = slots[team][index];
    if (!highlight || team !== highlight.team || index !== highlight.index || !card) return;
    dispatch({ type: "PLAY_CARD", payload: { card } });
  };

  // Carta da mão arrastada até o slot sorteado.
  const handleHandCardDrop = (handIndex: number) => {
    if (!highlight || !teams[currentTeam].inventory.hand[handIndex]) return;
    dispatch({ type: "PLACE_CARD", payload: { cardIndex: handIndex, positionIndex: highlight.index } });
  };

  const showAction = board.activeTab === "actionTab";

  return (
    <div
      style={{ "--fit": fit } as CSSProperties}
      className={`h-screen ${theme.background} flex flex-col overflow-hidden font-mono select-none relative transition-colors duration-700`}
    >
      {/* Round Countdown Overlay */}
      {turnPhase === "COUNTDOWN" && <RoundCountdown game={game} />}

      <div className="fixed top-0 left-0 right-0 z-50">
        <div
          className={`flex items-center justify-center gap-3 py-2 px-4 transition-all duration-700 ${
            theme.overlayScrim
          } backdrop-blur-sm`}
        >
          <div className={`w-2 h-2 rounded-full animate-pulse ${theme.teamBackground}`} />
          <span className={`text-xs font-bold tracking-[0.3em] uppercase ${theme.text}`}>
            Vez de {game.currentTeamName} - {game.currentPlayerName}
          </span>
          <div className={`w-2 h-2 rounded-full animate-pulse ${theme.teamBackground}`} />
        </div>
      </div>

      <GameOverOverlay
        visible={"gameOver" in game}
        message="MISSAO FALHOU"
        subMessage={
          state.bomb.exploded
            ? `CARGA DETONADA NO SITE ${state.bomb.position}`
            : teams.police.health <= 0
              ? "FORCAS POLICIAIS ELIMINADAS"
              : "FACCAO ELIMINADA"
        }
        onRetry={() => window.location.reload()}
      />

      <div className="flex min-h-0 flex-1 items-start gap-4 px-4 pt-12 pb-12">
        {/* Polícia (esquerda, como no tabuleiro) */}
        <FitColumn onScale={setFit}>
          <PlayerCard game={game} alignment="left" />
          <MissionStatus game={game} />
        </FitColumn>

        {/* Tabuleiro 3D */}
        <div className="relative h-full min-w-0 flex-1">
          <BoardStage
            turn={currentTeam}
            shot={shot}
            positions={positions}
            slots={slots}
            combatCard={combatCard}
            highlight={highlight}
            bottomInset={state.hud.inventory.isOpen ? INVENTORY_OPEN_HEIGHT * fit - BOARD_BOTTOM_GAP : 0}
            onSlotClick={handleSlotClick}
            onHandCardDrop={handleHandCardDrop}
            onPawnArrive={handlePawnArrive}
          />

          {/* Abas: campo de batalha / ação */}
          <div className="absolute left-1/2 top-2 z-10 flex -translate-x-1/2 overflow-hidden rounded-lg border border-white/10 bg-black/60 backdrop-blur">
            {TABS.map((tab) => {
              const enabled = board.enabledTabs[tab.id];
              const active = board.activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  disabled={!enabled}
                  onClick={() => dispatch({ type: "SWITCH_TAB", payload: tab.id })}
                  className={`flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                    active ? `${theme.text} bg-white/10` : "text-white/50 hover:text-white"
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  {!enabled && <Ban size={12} />}
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Aviso do slot sorteado */}
          {turnPhase === "PLACING" && d6 && (
            <div className="pointer-events-none absolute inset-x-0 top-12 z-10 flex flex-col items-center gap-1">
              <h2 className={`text-2xl font-black tracking-widest drop-shadow-lg ${theme.text}`}>
                POSICIONE UMA CARTA NO SLOT {d6}
              </h2>
              <p className="text-xs font-bold tracking-wider text-zinc-300 drop-shadow">
                ARRASTE OU CLIQUE NUMA CARTA DO INVENTÁRIO · CLIQUE NA CARTA DO SLOT PARA JOGÁ-LA
              </p>
            </div>
          )}

          {/* Painel de ação (dado / roleta) sobre o tabuleiro */}
          {showAction && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
              <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-black/75 p-4 shadow-2xl">
                <Action game={game} />
              </div>
            </div>
          )}
        </div>

        {/* Facção (direita) */}
        <FitColumn>
          <PlayerCard game={game} alignment="right" />
          <BombPanel game={game} />
          <DeckPanel game={game} onDraw={() => {}} disabled={true} />
        </FitColumn>
      </div>

      <InventoryPanel game={game} />
    </div>
  );
}
