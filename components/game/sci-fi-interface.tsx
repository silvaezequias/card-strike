"use client";

import { GameEngine, useGameEngine } from "@/game/useGameEngine";

import { GameOverOverlay } from "@/components/game/game-over-overlay";
import { PlayerCard } from "@/components/game/player-card";
import { MissionStatus } from "@/components/game/mission-status";
import { BombPanel } from "@/components/game/bomb-panel";
import { InventoryPanel } from "@/components/game/inventory-panel";
import { TurnBanner } from "@/components/game/turn-banner";
import { Action, ActionFrame, DiceDock } from "@/components/game/action";
import { BoardStage } from "@/components/game/board-stage";
import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";
import { useFitScale } from "@/game/useFitScale";
import { SetupSettings, TeamName } from "@/game/game-types";
import { useGameTheme } from "@/game/useGameTheme";
import { inConfrontation, isAttackCard, isFlashed, opponentOf } from "@/game/card-effects";
import { BOMB_FX_MS } from "@/game/card-fx";
import { useBot } from "@/game/useBot";
import { useCombatFx } from "@/game/useCombatFx";
import { playDiceHit, useGameSounds } from "@/game/useGameSounds";
import { isMuted, setMuted } from "@/lib/game-audio";
import { BombExplosion, FlashBlind } from "@/components/game/combat-fx";
import { CameraNav, CameraView, cardCameraFocus, mapCameraFocus } from "@/components/game/camera-nav";
import { MapBoard, MapMark, MapSpot } from "@/components/game/map-board";
import { CardBoardPreview, MainBoardView, MinimapButton } from "@/components/game/minimap";
import { Card } from "@/lib/types";
import { GateState, TutorialGateProvider, useGate } from "./tutorial-gate";
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

/** Na vez do bot o humano só assiste. */
const BOT_TURN_GATE: GateState = { allowed: ["camera"], highlight: null };

export default function SciFiInterface({
  playerSetup,
}: {
  playerSetup: SetupSettings;
}) {
  const game = useGameEngine(playerSetup);
  useBot(game);

  const botTurn = game.state.botTeam === game.state.currentTeam;

  return (
    <TutorialGateProvider value={botTurn ? BOT_TURN_GATE : null}>
      <GameScreen game={game} />
    </TutorialGateProvider>
  );
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
  const botTurn = state.botTeam === currentTeam;

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

  // Enquadramento escolhido nos botões do topo; null segue a câmera do jogo.
  const [view, setView] = useState<CameraView | null>(null);
  useEffect(() => setView(null), [turnPhase]);

  const shot =
    cardFlying || turnPhase === "COUNTDOWN" || view?.board === "cards" ? "overview" : "focus";

  const plantedSite = state.bomb.planted ? state.bomb.position : null;

  // Tabuleiro em destaque; o outro fica no minimapa da coluna esquerda.
  const [mainView, setMainView] = useState<MainBoardView>("cards");
  const toggleView = () => {
    setView(null);
    setMainView((v) => (v === "cards" ? "map" : "cards"));
    minimizeAction();
  };
  const showView = (next: CameraView) => {
    setView(next);
    setMainView(next.board);
    minimizeAction();
  };
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

  const shownView = fx.active ? null : view;
  const me = state.botTeam ? opponentOf(state.botTeam) : currentTeam;

  const fighters = {
    police: { name: teams.police.playerName, health: teams.police.health + fx.pendingDamage("police") },
    faction: { name: teams.faction.playerName, health: teams.faction.health + fx.pendingDamage("faction") },
  };

  // Fogo na metade inimiga do site; Smoke em quem jogou.
  const effectsOnMap: MapMark[] = state.mapEffects
    .filter((effect) => !fx.hidesEffect(effect.id))
    .map((effect) => ({
      id: effect.id,
      name: effect.name,
      spot: effect.spot ?? "BASE",
      team: effect.name === "Molotov" ? opponentOf(effect.owner) : effect.owner,
    }));

  // A tela de fim de jogo espera a explosão da C4 e a última animação.
  const { exploded } = state.bomb;
  const [bombFxDone, setBombFxDone] = useState(false);
  useEffect(() => {
    if (!exploded) return;
    const timer = window.setTimeout(() => setBombFxDone(true), BOMB_FX_MS);
    return () => window.clearTimeout(timer);
  }, [exploded]);
  const bombFxPlaying = exploded && !bombFxDone;

  useGameSounds(state, fx, game.tool.dice.shaking, game.gameOver && !fx.active && !bombFxPlaying);

  const [soundOff, setSoundOff] = useState(false);
  useEffect(() => setSoundOff(isMuted()), []);
  const toggleSound = () => {
    setMuted(!soundOff);
    setSoundOff(!soundOff);
  };

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
  const cameraGate = useGate("camera");

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
    !botTurn && (turnPhase === "PLACING" || turnPhase === "BUYING") && (buyGate.allowed || handFull)
      ? {
          team: currentTeam,
          canBuy: !handFull && !state.boughtThisTurn,
          strong: buyGate.highlighted,
          blockedLabel: state.boughtThisTurn ? "JÁ COMPROU" : "MÃO CHEIA",
        }
      : null;
  const handleDeckClick = () => {
    if (deck?.canBuy) dispatch({ type: "BUY_CARD" });
  };

  const showAction = board.activeTab === "actionTab";
  // Painel de ação minimizado: o jogador olha os tabuleiros e volta quando quiser.
  const canMinimizeAction = board.enabledTabs.battlefieldTab && tabsGate.allowed;
  const actionPending = turnPhase === "CHOOSING" || turnPhase === "ACTING";
  // Olhar outro tabuleiro tira o painel da frente.
  const minimizeAction = () => {
    if (showAction && canMinimizeAction) dispatch({ type: "SWITCH_TAB", payload: "battlefieldTab" });
  };

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
          className="flex items-center justify-center gap-3 py-2 px-4 bg-black/20 backdrop-blur-sm"
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
              bottomInset={state.hud.inventory.isOpen && !botTurn ? INVENTORY_OPEN_HEIGHT * fit - BOARD_BOTTOM_GAP : 0}
              hudInset={{ x: centerArea.left + centerArea.right, y: centerArea.top + centerArea.bottom }}
              cameraFocus={tutorialCamera?.board === "cards" ? tutorialCamera : cardCameraFocus(shownView, me)}
              dice={game.tool.dice}
              onDiceHit={playDiceHit}
              onDiceSettled={game.tool.finishRoll}
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
              fighters={fighters}
              focus={tutorialCamera?.board === "map" ? tutorialCamera : mapCameraFocus(shownView)}
              className="w-[min(96cqw,150cqh)]"
            />
          </div>
        </div>

        <div className="pointer-events-none absolute z-10" style={centerArea}>
          {/* Atalhos de câmera */}
          {!boardClear && cameraGate.allowed && (
            <div className="pointer-events-auto absolute left-1/2 top-2 z-20 -translate-x-1/2">
              <CameraNav board={mainView} view={shownView} activeClass={theme.text} onSelect={showView} />
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

          {!boardClear && !botTurn && turnPhase === "PLACING" && d6 && !rangeWarning && (
            <div className="pointer-events-none absolute inset-x-0 top-12 z-10 flex flex-col items-center gap-1">
              <h2 className={`text-2xl font-black tracking-widest drop-shadow-lg ${theme.text}`}>
                {slots[currentTeam][d6 - 1]
                  ? `SLOT ${d6}: CLIQUE NA CARTA PARA JOGÁ-LA`
                  : `POSICIONE UMA CARTA NO SLOT ${d6}`}
              </h2>
              <p className="text-xs font-bold tracking-wider text-zinc-300 drop-shadow">
                {state.boughtThisTurn
                  ? "COMPRA DA RODADA FEITA · ARRASTE OU CLIQUE NUMA CARTA DO INVENTÁRIO"
                  : handFull
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
        {/* Com o dado o tabuleiro fica livre: é onde ele rola. */}
        {!boardClear && !botTurn && showAction && state.tool.selected === "d6" && <DiceDock game={game} />}

        {!boardClear && !botTurn && showAction && state.tool.selected !== "d6" && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/30"
            style={{ paddingLeft: centerArea.left, paddingRight: centerArea.right }}
          >
            <ActionFrame>
              {canMinimizeAction && (
                <button
                  onClick={() => dispatch({ type: "SWITCH_TAB", payload: "battlefieldTab" })}
                  className="absolute right-6 top-3 z-10 flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Minimize2 size={12} />
                  Minimizar
                </button>
              )}
              <Action game={game} />
            </ActionFrame>
          </div>
        )}

        {/* Painel minimizado: fica aqui até o jogador reabrir */}
        {!boardClear && !botTurn && actionPending && !showAction && (
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

      {/* Na vez do bot a mão dele fica escondida. */}
      {!botTurn && (
        <div className={hudFocus?.hud.includes("inventory") ? "" : hudClass("inventory")}>
          <InventoryPanel game={game} spotlight={!!hudFocus?.hud.includes("inventory")} />
        </div>
      )}

      <button
        onClick={toggleSound}
        aria-label={soundOff ? "Ligar som" : "Desligar som"}
        title={soundOff ? "Ligar som" : "Desligar som"}
        className="fixed bottom-3 right-3 z-40 flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-black/30 text-zinc-300 backdrop-blur-sm transition-colors hover:text-white"
      >
        {soundOff ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>

      {turnPhase === "IDLE" && isFlashed(teams[currentTeam]) && <FlashBlind />}
      {bombFxPlaying && <BombExplosion />}

      {overlay}
    </div>
  );
}
