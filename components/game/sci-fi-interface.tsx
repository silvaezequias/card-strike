"use client";

import { GameEngine, useGameEngine } from "@/game/useGameEngine";

import { GameOverOverlay } from "@/components/game/game-over-overlay";
import { PlayerCard } from "@/components/game/player-card";
import { MissionStatus } from "@/components/game/mission-status";
import { BombPanel } from "@/components/game/bomb-panel";
import { InventoryPanel } from "@/components/game/inventory-panel";
import { TurnBanner } from "@/components/game/turn-banner";
import { Action } from "@/components/game/action";
import { BoardStage } from "@/components/game/board-stage";
import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";
import { Ban, Maximize2, Minimize2 } from "lucide-react";
import { useFitScale } from "@/game/useFitScale";
import { SetupSettings, TBoardTabs, TeamName } from "@/game/game-types";
import { useGameTheme } from "@/game/useGameTheme";
import { inConfrontation, isAttackCard, isFlashed } from "@/game/card-effects";
import { BOMB_FX_MS } from "@/game/card-fx";
import { useCombatFx } from "@/game/useCombatFx";
import { BombExplosion, FlashBlind } from "@/components/game/combat-fx";
import { MapBoard, MapSpot } from "@/components/game/map-board";
import { CardBoardPreview, MainBoardView, MinimapButton } from "@/components/game/minimap";
import { Card } from "@/lib/types";
import { useGate } from "./tutorial-gate";
import { CameraFocus, HudElement } from "@/lib/tutorial/types";
import { HIGHLIGHT_CLASS } from "./tutorial-gate";

/** Coluna lateral que encolhe para caber na altura da tela. */
const FitColumn = ({
  children,
  onScale,
  onWidth,
  className = "",
  dimmed = false,
}: {
  children: ReactNode;
  onScale?: (scale: number) => void;
  /** Largura ocupada na tela, já com a escala. */
  onWidth?: (width: number) => void;
  className?: string;
  /** Apagada enquanto a câmera do tutorial foca o tabuleiro. */
  dimmed?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const fit = useFitScale(ref, { reserveTop: 56, reserveBottom: 56, reserveX: 0, minScale: 0.45 });

  useEffect(() => onScale?.(fit.scale), [fit.scale, onScale]);
  useEffect(() => onWidth?.(fit.width * fit.scale), [fit.width, fit.scale, onWidth]);

  return (
    <div
      className={`pointer-events-none absolute top-12 z-20 transition-opacity duration-500 ${className} ${dimmed ? DIMMED : ""}`}
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

/** Espaço entre a HUD e a área central: a câmera enquadra só essa área. */
const HUD_SIDE_GAP = 32;
const HUD_Y_INSET = 48;

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
  const [leftHud, setLeftHud] = useState(0);
  const [rightHud, setRightHud] = useState(0);

  // Área livre entre as colunas da HUD; o jogo desenha na tela inteira.
  const centerArea = {
    left: leftHud + HUD_SIDE_GAP,
    right: rightHud + HUD_SIDE_GAP,
    top: HUD_Y_INSET,
    bottom: HUD_Y_INSET,
  };

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
  // Foco do tutorial: mostra o tabuleiro pedido e volta às cartas quando termina.
  const cameraBoard =
    tutorialCamera && tutorialCamera.board !== "hud" ? tutorialCamera.board : null;

  // Cada ação foca o tabuleiro que usa: a roleta no mapa, o resto nas cartas.
  // Em IDLE fica onde está, para ver o peão chegar depois da roleta.
  const selectedTool = state.tool.selected;
  useEffect(() => {
    if (cameraBoard) return;
    if (selectedTool === "spinner") setMainView("map");
    else if (turnPhase !== "IDLE") setMainView("cards");
  }, [selectedTool, turnPhase, cameraBoard]);

  // Carta jogada: mostra o voo, vai ao mapa para a ação e volta às cartas.
  const fx = useCombatFx(state.combatEvent);
  useEffect(() => {
    if (cameraBoard) return;
    if (fx.stage === "camera" && fx.active) setMainView("map");
    if (fx.stage === "return" && fx.active) setMainView("cards");
  }, [fx.stage, fx.active, cameraBoard]);

  const effectsOnMap: Record<TeamName, string[]> = {
    police: teams.police.effects.map((e) => e.name).filter((name) => !fx.hidesEffect("police", name)),
    faction: teams.faction.effects.map((e) => e.name).filter((name) => !fx.hidesEffect("faction", name)),
  };

  // A tela de fim de jogo espera a explosão da C4 e a última animação.
  const { exploded } = state.bomb;
  const [bombFxDone, setBombFxDone] = useState(false);
  useEffect(() => {
    if (!exploded) return;
    const timer = window.setTimeout(() => setBombFxDone(true), BOMB_FX_MS);
    return () => window.clearTimeout(timer);
  }, [exploded]);
  const bombFxPlaying = exploded && !bombFxDone;

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

  // Ataque fora de confronto: o 1º clique só avisa, o 2º joga a carta.
  const [warnedCardId, setWarnedCardId] = useState<Card["id"] | null>(null);
  useEffect(() => setWarnedCardId(null), [turnPhase]);
  const drawnCard = d6 ? slots[currentTeam][d6 - 1] : null;
  const rangeWarning = !!drawnCard && drawnCard.id === warnedCardId;

  const highlight =
    turnPhase === "PLACING" && d6
      ? { team: currentTeam, index: d6 - 1, warning: rangeWarning }
      : null;

  const playGate = useGate("play");
  const placeGate = useGate("place");
  const buyGate = useGate("buy");
  const tabsGate = useGate("tabs");

  // Clicar na carta do slot sorteado joga a carta (vai para a zona de combate).
  const handleSlotClick = (team: TeamName, index: number) => {
    const card = slots[team][index];
    if (!playGate.allowed) return;
    if (!highlight || team !== highlight.team || index !== highlight.index || !card) return;
    if (isAttackCard(card) && !inConfrontation(state) && !rangeWarning) {
      setWarnedCardId(card.id);
      return;
    }
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
  // Painel de ação minimizado: o jogador olha os tabuleiros e volta quando quiser.
  const canMinimizeAction = board.enabledTabs.battlefieldTab && tabsGate.allowed;
  const actionPending = turnPhase === "CHOOSING" || turnPhase === "ACTING";

  // Foco de câmera do tutorial: nada por cima do tabuleiro e o resto apagado.
  const focusMode = !!tutorialCamera;
  const hudFocus = tutorialCamera?.board === "hud" ? tutorialCamera : null;

  /**
   * Classe de cada elemento da HUD durante o foco: destacado se o tutorial
   * pediu; apagado no foco de tabuleiro ou no foco total da HUD.
   */
  const hudClass = (key: HudElement) => {
    const base = "transition-opacity duration-500";
    const live = `pointer-events-auto ${base}`;
    if (hudFocus) {
      if (hudFocus.hud.includes(key)) return `${live} relative z-30 rounded-xl ${HIGHLIGHT_CLASS}`;
      return hudFocus.dim ? `${base} ${DIMMED}` : live;
    }
    return focusMode ? `${base} ${DIMMED}` : live;
  };
  const boardClear = focusMode || hideBoardOverlays;

  return (
    <div
      style={{ "--fit": fit } as CSSProperties}
      // overflow-clip: o tabuleiro fora de cena não pode rolar a tela (foco, teclado).
      className={`h-screen bg-[#050409] flex flex-col overflow-clip font-mono select-none relative ${
        bombFxPlaying ? "bomb-shock" : ""
      }`}
    >
      {/* Aviso de novo turno; segue trocando o turno por trás do foco, só fica invisível. */}
      <div className={focusMode ? "opacity-0" : ""}>
        <TurnBanner game={game} />
      </div>

      <div className={`fixed top-0 left-0 right-0 z-50 ${hudClass("turn-bar")}`}>
        <div
          className="flex items-center justify-center gap-3 py-2 px-4"
        >
          <div className={`w-2 h-2 rounded-full animate-pulse ${theme.teamBackground}`} />
          <span className={`text-xs font-bold tracking-[0.3em] uppercase ${theme.text}`}>
            Vez de {game.currentTeamName} - {game.currentPlayerName}
          </span>
          <div className={`w-2 h-2 rounded-full animate-pulse ${theme.teamBackground}`} />
        </div>
      </div>

      <GameOverOverlay
        visible={game.gameOver && !fx.active && !bombFxPlaying}
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

      <div className="relative min-h-0 flex-1">
        {/* Polícia (esquerda, como no tabuleiro) */}
        <FitColumn onScale={setFit} onWidth={setLeftHud} className="left-4">
          <div className={hudClass("player-police")}>
            <PlayerCard game={game} alignment="left" pendingDamage={fx.pendingDamage("police")} />
          </div>
          <div className={`w-[256px] ${hudClass("minimap")}`}>
            <MinimapButton label={mainView === "cards" ? "MAPA" : "CARTAS"} onClick={toggleView}>
              {mainView === "cards" ? (
                <MapBoard positions={positions} bomb={plantedSite} effects={effectsOnMap} autoZoom flat className="w-full" />
              ) : (
                <CardBoardPreview />
              )}
            </MinimapButton>
          </div>
          <div className={hudClass("mission")}>
            <MissionStatus game={game} />
          </div>
        </FitColumn>

        {/* Tabuleiro 3D, atrás da HUD */}
        <div className={`absolute inset-0 transition-opacity duration-500 ${hudFocus?.dim ? DIMMED : ""}`}>
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
              hudInset={{ x: centerArea.left + centerArea.right, y: centerArea.top + centerArea.bottom }}
              cameraFocus={tutorialCamera?.board === "cards" ? tutorialCamera : null}
              onSlotClick={handleSlotClick}
              onHandCardDrop={handleHandCardDrop}
              deck={deck}
              onDeckClick={handleDeckClick}
            />
          </div>

          {/* Mapa tático em destaque */}
          <div
            className="absolute flex items-center justify-center px-4 pb-6 pt-14 [container-type:size]"
            style={{ ...centerArea, ...boardLayer(mainView === "map", 1) }}
          >
            <MapBoard
              positions={positions}
              bomb={plantedSite}
              effects={effectsOnMap}
              fx={fx.event ? { event: fx.event, stage: fx.stage } : null}
              focus={tutorialCamera?.board === "map" ? tutorialCamera : null}
              className="w-[min(96cqw,150cqh)]"
            />
          </div>
        </div>

        <div className="pointer-events-none absolute z-10" style={centerArea}>
          {/* Abas: campo de batalha / ação */}
          {!boardClear && (
          <div className="pointer-events-auto absolute left-1/2 top-2 z-10 flex -translate-x-1/2 overflow-hidden rounded-lg border border-white/10 bg-black/60 backdrop-blur">
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
          {!boardClear && turnPhase === "PLACING" && rangeWarning && (
            <div className="pointer-events-none absolute inset-x-0 top-12 z-10 flex flex-col items-center gap-1 text-center">
              <h2 className="text-2xl font-black tracking-widest text-red-500 drop-shadow-lg">
                VOCÊS NÃO ESTÃO EM CONFRONTO
              </h2>
              <p className="text-xs font-bold tracking-wider text-zinc-300 drop-shadow">
                VOCÊS NÃO ESTÃO NO MESMO BOMBSITE. QUER JOGAR A CARTA MESMO ASSIM? CLIQUE NELA DE NOVO.
              </p>
            </div>
          )}

          {!boardClear && turnPhase === "PLACING" && d6 && !rangeWarning && (
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

          {/* Resultado da carta jogada */}
          {!boardClear && turnPhase === "IDLE" && state.lastResult && (!fx.event || fx.landed > 0) && (
            <div className="pointer-events-none absolute inset-x-0 top-12 z-10 flex justify-center">
              <h2 className={`text-2xl font-black tracking-widest drop-shadow-lg ${theme.text}`}>
                {state.lastResult}
              </h2>
            </div>
          )}

        </div>

        {/* Painel de ação (dado / roleta) sobre o tabuleiro */}
        {!boardClear && showAction && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <div className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-black/75 p-4 shadow-2xl">
              {canMinimizeAction && (
                <button
                  onClick={() => dispatch({ type: "SWITCH_TAB", payload: "battlefieldTab" })}
                  className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Minimize2 size={12} />
                  Minimizar
                </button>
              )}
              <Action game={game} />
            </div>
          </div>
        )}

        {/* Painel minimizado: fica aqui até o jogador reabrir */}
        {!boardClear && actionPending && !showAction && (
          <button
            onClick={() => dispatch({ type: "SWITCH_TAB", payload: "actionTab" })}
            className={`absolute bottom-16 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-lg border-2 ${theme.border} bg-black/80 px-5 py-2 text-xs font-bold uppercase tracking-widest ${theme.text} shadow-2xl transition-transform hover:scale-105 active:scale-95`}
          >
            <Maximize2 size={14} />
            Mostrar ações
          </button>
        )}

        {/* Facção (direita) */}
        <FitColumn onWidth={setRightHud} className="right-4">
          <div className={hudClass("player-faction")}>
            <PlayerCard game={game} alignment="right" pendingDamage={fx.pendingDamage("faction")} />
          </div>
          <div className={hudClass("bomb")}>
            <BombPanel game={game} />
          </div>
        </FitColumn>
      </div>

      <div className={hudFocus?.hud.includes("inventory") ? "" : hudClass("inventory")}>
        <InventoryPanel game={game} spotlight={!!hudFocus?.hud.includes("inventory")} />
      </div>

      {turnPhase === "IDLE" && isFlashed(teams[currentTeam]) && <FlashBlind />}
      {bombFxPlaying && <BombExplosion />}

      {overlay}
    </div>
  );
}
