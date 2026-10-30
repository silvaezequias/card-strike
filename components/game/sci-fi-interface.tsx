"use client";

import { GameEngine, useGameEngine } from "@/game/useGameEngine";

import { GameOverOverlay } from "@/components/game/game-over-overlay";
import { PlayerCard } from "@/components/game/player-card";
import { MissionStatus } from "@/components/game/mission-status";
import { BombPanel } from "@/components/game/bomb-panel";
import { InventoryPanel } from "@/components/game/inventory-panel";
import { RoundCountdown } from "@/components/game/round-countdown";
import { Action } from "@/components/game/action";
import { BoardStage } from "@/components/game/board-stage";
import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";
import { Ban } from "lucide-react";
import { useFitScale } from "@/game/useFitScale";
import { SetupSettings, TBoardTabs, TeamName } from "@/game/game-types";
import { useGameTheme } from "@/game/useGameTheme";
import { MapBoard, MapSpot } from "@/components/game/map-board";
import { CardBoardPreview, MainBoardView, MinimapButton } from "@/components/game/minimap";
import { Card } from "@/lib/types";
import { useGate } from "./tutorial-gate";
import { CameraFocus } from "@/lib/tutorial/types";

/** Coluna lateral que encolhe para caber na altura da tela. */
const FitColumn = ({
  children,
  onScale,
  dimmed = false,
}: {
  children: ReactNode;
  onScale?: (scale: number) => void;
  /** Apagada enquanto a câmera do tutorial foca o tabuleiro. */
  dimmed?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const fit = useFitScale(ref, { reserveTop: 56, reserveBottom: 56, reserveX: 0, minScale: 0.45 });

  useEffect(() => onScale?.(fit.scale), [fit.scale, onScale]);

  return (
    <div
      className={`relative z-20 flex-shrink-0 transition-opacity duration-500 ${dimmed ? DIMMED : ""}`}
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

/**
 * Camada de um tabuleiro na troca cartas ↔ mapa: o ativo fica no centro; o
 * outro fica fora da tela, do lado `side` (-1 esquerda, 1 direita), menor e
 * apagado. A transição dá a sensação da câmera indo de um para o outro.
 */
const boardLayer = (active: boolean, side: -1 | 1): CSSProperties => ({
  transform: active ? "translateX(0) scale(1)" : `translateX(${side * 115}%) scale(0.75)`,
  opacity: active ? 1 : 0,
  pointerEvents: active ? "auto" : "none",
  transition:
    "transform 900ms cubic-bezier(0.65, 0, 0.35, 1), opacity 700ms ease",
});

/** Interface apagada (e sem clique) durante o foco de câmera do tutorial. */
const DIMMED = "pointer-events-none opacity-20";

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
  return <GameScreen game={game} />;
}

/**
 * Tela da partida para um motor já criado. O tutorial usa a mesma tela
 * com um motor roteirizado e coloca o diálogo em `overlay`.
 */
export function GameScreen({
  game,
  overlay,
  tutorialCamera = null,
  hideBoardOverlays = false,
}: {
  game: GameEngine;
  overlay?: ReactNode;
  /** Foco de câmera pedido pelo tutorial (cartas ou mapa). */
  tutorialCamera?: CameraFocus | null;
  /** Esconde painel de ação, abas e avisos de cima do tabuleiro (falas do tutorial). */
  hideBoardOverlays?: boolean;
}) {
  const { state, dispatch } = game;
  const { currentTeam, turnPhase, teams, board } = state;

  const theme = useGameTheme(currentTeam);
  const [fit, setFit] = useState(1);

  /* ───────── Tabuleiro ───────── */

  const positions: Record<TeamName, MapSpot> = {
    police: teams.police.position ?? "BASE",
    faction: teams.faction.position ?? "BASE",
  };

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

  const shot = cardFlying || turnPhase === "COUNTDOWN" ? "overview" : "focus";

  const plantedSite = state.bomb.planted ? state.bomb.position : null;

  // Tabuleiro em destaque; o outro fica no minimapa da coluna esquerda.
  const [mainView, setMainView] = useState<MainBoardView>("cards");
  const toggleView = () => setMainView((v) => (v === "cards" ? "map" : "cards"));
  // Hora de mexer nos slots: volta para as cartas.
  useEffect(() => {
    if (turnPhase === "PLACING") setMainView("cards");
  }, [turnPhase]);

  // Foco do tutorial: mostra o tabuleiro pedido e volta às cartas quando termina.
  const cameraBoard = tutorialCamera?.board ?? null;
  const lastCameraBoard = useRef<string | null>(null);
  useEffect(() => {
    if (cameraBoard) setMainView(cameraBoard);
    else if (lastCameraBoard.current) setMainView("cards");
    lastCameraBoard.current = cameraBoard;
  }, [cameraBoard]);

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

  const playGate = useGate("play");
  const placeGate = useGate("place");
  const buyGate = useGate("buy");
  const tabsGate = useGate("tabs");

  // Clicar na carta do slot sorteado joga a carta (vai para a zona de combate).
  const handleSlotClick = (team: TeamName, index: number) => {
    const card = slots[team][index];
    if (!playGate.allowed) return;
    if (!highlight || team !== highlight.team || index !== highlight.index || !card) return;
    dispatch({ type: "PLAY_CARD", payload: { card } });
  };

  // Carta da mão arrastada até o slot sorteado.
  const handleHandCardDrop = (handIndex: number) => {
    if (!placeGate.allowed) return;
    if (!highlight || !teams[currentTeam].inventory.hand[handIndex]) return;
    dispatch({ type: "PLACE_CARD", payload: { cardIndex: handIndex, positionIndex: highlight.index } });
  };

  // Na hora de posicionar o baralho do time fica clicável, se a mão tiver espaço.
  const handFull = teams[currentTeam].inventory.hand.length >= 3;
  // Compra bloqueada pelo tutorial (com mão livre): o baralho nem acende.
  const deck =
    (turnPhase === "PLACING" || turnPhase === "BUYING") && (buyGate.allowed || handFull)
      ? { team: currentTeam, canBuy: !handFull, strong: buyGate.highlighted }
      : null;
  const handleDeckClick = () => {
    if (deck?.canBuy) dispatch({ type: "BUY_CARD" });
  };

  const showAction = board.activeTab === "actionTab";

  // Foco de câmera do tutorial: nada por cima do tabuleiro e o resto apagado.
  const focusMode = !!tutorialCamera;
  const boardClear = focusMode || hideBoardOverlays;

  return (
    <div
      style={{ "--fit": fit } as CSSProperties}
      className={`h-screen ${theme.background} flex flex-col overflow-hidden font-mono select-none relative transition-colors duration-700`}
    >
      {/* Round Countdown Overlay */}
      {turnPhase === "COUNTDOWN" && (
        // Continua contando por trás do foco, só fica invisível.
        <div className={focusMode ? "opacity-0" : ""}>
          <RoundCountdown game={game} />
        </div>
      )}

      <div className={`fixed top-0 left-0 right-0 z-50 transition-opacity duration-500 ${focusMode ? DIMMED : ""}`}>
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
        <FitColumn onScale={setFit} dimmed={focusMode}>
          <PlayerCard game={game} alignment="left" />
          <div className="w-[256px]">
            <MinimapButton label={mainView === "cards" ? "MAPA" : "CARTAS"} onClick={toggleView}>
              {mainView === "cards" ? (
                <MapBoard positions={positions} bomb={plantedSite} autoZoom className="w-full" />
              ) : (
                <CardBoardPreview />
              )}
            </MinimapButton>
          </div>
          <MissionStatus game={game} />
        </FitColumn>

        {/* Tabuleiro 3D */}
        <div className="relative h-full min-w-0 flex-1 overflow-hidden">
          {/* Os dois tabuleiros ficam lado a lado e a câmera desliza de um para o
              outro; o que sai se afasta. Ambos seguem montados (estado e animações). */}
          <div className="absolute inset-0" style={boardLayer(mainView === "cards", -1)}>
            <BoardStage
              turn={currentTeam}
              shot={shot}
              slots={slots}
              combatCard={combatCard}
              highlight={highlight}
              bottomInset={state.hud.inventory.isOpen ? INVENTORY_OPEN_HEIGHT * fit - BOARD_BOTTOM_GAP : 0}
              cameraFocus={tutorialCamera?.board === "cards" ? tutorialCamera : null}
              onSlotClick={handleSlotClick}
              onHandCardDrop={handleHandCardDrop}
              deck={deck}
              onDeckClick={handleDeckClick}
            />
          </div>

          {/* Mapa tático em destaque */}
          <div
            className="absolute inset-0 flex items-center justify-center px-4 pb-6 pt-14 [container-type:size]"
            style={boardLayer(mainView === "map", 1)}
          >
            <MapBoard
              positions={positions}
              bomb={plantedSite}
              focus={tutorialCamera?.board === "map" ? tutorialCamera : null}
              className="w-[min(96cqw,150cqh)]"
            />
          </div>

          {/* Abas: campo de batalha / ação */}
          {!boardClear && (
          <div className="absolute left-1/2 top-2 z-10 flex -translate-x-1/2 overflow-hidden rounded-lg border border-white/10 bg-black/60 backdrop-blur">
            {TABS.map((tab) => {
              const enabled = board.enabledTabs[tab.id] && tabsGate.allowed;
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
          )}

          {/* Aviso do slot sorteado */}
          {!boardClear && turnPhase === "PLACING" && d6 && (
            <div className="pointer-events-none absolute inset-x-0 top-12 z-10 flex flex-col items-center gap-1">
              <h2 className={`text-2xl font-black tracking-widest drop-shadow-lg ${theme.text}`}>
                {slots[currentTeam][d6 - 1]
                  ? `SLOT ${d6}: CLIQUE NA CARTA PARA JOGÁ-LA`
                  : `POSICIONE UMA CARTA NO SLOT ${d6}`}
              </h2>
              <p className="text-xs font-bold tracking-wider text-zinc-300 drop-shadow">
                {handFull
                  ? "MÃO CHEIA · ARRASTE OU CLIQUE NUMA CARTA DO INVENTÁRIO"
                  : "COMPRE NO BARALHO · ARRASTE OU CLIQUE NUMA CARTA DO INVENTÁRIO"}
              </p>
            </div>
          )}

          {/* Painel de ação (dado / roleta) sobre o tabuleiro */}
          {!boardClear && showAction && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
              <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-black/75 p-4 shadow-2xl">
                <Action game={game} />
              </div>
            </div>
          )}
        </div>

        {/* Facção (direita) */}
        <FitColumn dimmed={focusMode}>
          <PlayerCard game={game} alignment="right" />
          <BombPanel game={game} />
        </FitColumn>
      </div>

      <div className={`transition-opacity duration-500 ${focusMode ? DIMMED : ""}`}>
        <InventoryPanel game={game} />
      </div>

      {overlay}
    </div>
  );
}
