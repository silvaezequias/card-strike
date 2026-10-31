"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { TeamName } from "@/game/game-types";
import { Card } from "@/lib/types";
import { NoirCard } from "@/components/art/noir-card";
import { getPalette } from "@/components/art/palette";
import {
  BOARD_H,
  BOARD_W,
  BOMB_BOX,
  COMBAT_CARD,
  MAP_CENTER,
  Point,
  Rect,
  TEAM_CARD_ROTATION,
  TacticalBoard,
  deckRect,
  gridFrame,
  slotRect,
} from "@/components/art/tactical-board";

/* ═══════════════════════════════════════════════
   CÂMERA
   O tabuleiro fica num plano 3D. Cada "tomada" define
   o ponto focado, a inclinação, o giro em volta da mesa
   e o zoom; trocar de tomada anima tudo junto. Por cima
   disso o jogador pode orbitar livremente (arrastar e
   rolar), e a órbita volta a zero na próxima tomada.
   ═══════════════════════════════════════════════ */

export type CameraShot = "overview" | "focus";

/** Giro da mesa para cada jogador ver seu lado de frente. */
const TEAM_VIEW_ROTATION: Record<TeamName, number> = { police: -90, faction: 90 };

type CameraPose = { focus: Point; tilt: number; rotate: number; scale: number };
type Orbit = { rotate: number; tilt: number; zoom: number };

const NO_ORBIT: Orbit = { rotate: 0, tilt: 0, zoom: 1 };
const TILT_RANGE = [8, 72] as const;
const ZOOM_RANGE = [0.5, 2.6] as const;

const clamp = (v: number, [min, max]: readonly [number, number]) => Math.min(max, Math.max(min, v));

/** Parte do tabuleiro de cartas que o tutorial pede para focar. */
export type CardCameraFocus = {
  area: "overview" | "side" | "grid" | "slot" | "deck" | "combat" | "bomb";
  team?: TeamName;
  slot?: number;
  /** Foco total: escurece o que estiver fora da seleção. */
  dim?: boolean;
};

const rectCenterOf = (r: Rect): Point => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

/**
 * Enquadramento de uma parte do tabuleiro: centro, tamanho visto pelo
 * jogador (largura x profundidade), giro e o retângulo destacado.
 */
const focusTarget = (focus: CardCameraFocus) => {
  const team = focus.team ?? "police";
  switch (focus.area) {
    case "side": {
      // Metade da mesa do time: grade, baralho e faixa com o nome.
      const half = BOARD_W / 2;
      const spot = { x: team === "police" ? 24 : half + 4, y: 24, w: half - 28, h: BOARD_H - 48 };
      return { center: rectCenterOf(spot), w: spot.h, h: spot.w, rotate: TEAM_VIEW_ROTATION[team], spotlight: spot };
    }
    case "grid": {
      const g = gridFrame(team);
      const spot = { x: g.center.x - g.h / 2, y: g.center.y - g.w / 2, w: g.h, h: g.w };
      return { center: g.center, w: g.w, h: g.h, rotate: TEAM_VIEW_ROTATION[team], spotlight: spot };
    }
    case "slot": {
      const r = slotRect(team, Math.min(5, Math.max(0, (focus.slot ?? 1) - 1)));
      return { center: rectCenterOf(r), w: r.h * 2.4, h: r.w * 2.4, rotate: TEAM_VIEW_ROTATION[team], spotlight: r };
    }
    case "deck": {
      const r = deckRect(team);
      return { center: rectCenterOf(r), w: r.h * 3, h: r.w * 3, rotate: TEAM_VIEW_ROTATION[team], spotlight: r };
    }
    case "combat":
      return { center: rectCenterOf(COMBAT_CARD), w: COMBAT_CARD.w * 3.4, h: COMBAT_CARD.h * 2.6, rotate: 0, spotlight: COMBAT_CARD };
    case "bomb":
      return { center: rectCenterOf(BOMB_BOX), w: BOMB_BOX.w * 2.6, h: BOMB_BOX.h * 3.4, rotate: 0, spotlight: BOMB_BOX };
    default:
      return null;
  }
};

const getPose = (
  shot: CameraShot,
  team: TeamName,
  viewport: { w: number; h: number },
): CameraPose => {
  if (shot === "focus") {
    const grid = gridFrame(team);
    const tilt = 30;
    const scale = Math.min(
      (viewport.w * 0.84) / grid.w,
      (viewport.h * 0.76) / (grid.h * Math.cos((tilt * Math.PI) / 180)),
    );
    return { focus: grid.center, tilt, rotate: TEAM_VIEW_ROTATION[team], scale };
  }

  const tilt = 38;
  const scale = Math.min(
    (viewport.w * 0.9) / BOARD_W,
    (viewport.h * 0.76) / (BOARD_H * Math.cos((tilt * Math.PI) / 180)),
  );
  return { focus: MAP_CENTER, tilt, rotate: 0, scale };
};

/* ═══════════════════════════════════════════════
   PALCO
   ═══════════════════════════════════════════════ */

/** Tipo de dado do arrasto de uma carta da mão (valor: índice na mão). */
export const HAND_CARD_DRAG = "application/x-card-strike-hand";

/** Tamanho da carta (em pé, 3:4) dentro de uma área com um giro. */
const cardBox = (rect: Rect, rotate: number) => {
  // Girada ±90° a carta ocupa o retângulo deitado.
  const sideways = Math.abs(rotate % 180) === 90;
  return { w: (sideways ? rect.h : rect.w) * 0.9, h: (sideways ? rect.w : rect.h) * 0.9 };
};

const rectCenter = (rect: Rect): Point => ({ x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 });

/** De onde a carta vem ao aparecer, relativo à posição final. */
type CardEntrance = {
  dx: number;
  dy: number;
  /** Altura sobre a mesa no começo e no meio do voo. */
  z: number;
  arc: number;
  rotate: number;
  scale: number;
  duration: number;
  delay?: number;
};

/** Carta numa área do tabuleiro, girada para o seu jogador. */
const CardOnBoard = ({
  card,
  rect,
  team,
  rotate,
  entrance,
  onClick,
}: {
  card: Card;
  rect: Rect;
  team: TeamName;
  rotate: number;
  entrance?: CardEntrance | null;
  onClick?: () => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { w, h } = cardBox(rect, rotate);

  // Voo de entrada só na montagem: sobe, faz um arco e pousa no lugar.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !entrance) return;
    const e = entrance;
    const midRotate = (e.rotate + rotate) / 2;
    const midScale = (e.scale + 1) / 2 + 0.08;
    el.animate(
      [
        { transform: `translate3d(${e.dx}px, ${e.dy}px, ${e.z}px) rotate(${e.rotate}deg) scale(${e.scale})` },
        {
          transform: `translate3d(${e.dx * 0.4}px, ${e.dy * 0.4}px, ${e.arc}px) rotate(${midRotate}deg) scale(${midScale})`,
          offset: 0.55,
        },
        { transform: `translate3d(0px, 0px, 0px) rotate(${rotate}deg) scale(1)` },
      ],
      {
        duration: e.duration,
        delay: e.delay ?? 0,
        easing: "cubic-bezier(0.25, 0.7, 0.3, 1)",
        fill: "backwards",
      },
    );
    // Só na montagem: mudanças depois não refazem o voo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      className={`absolute ${onClick ? "cursor-pointer transition-[filter] hover:brightness-125" : ""}`}
      onClick={onClick}
      style={{
        left: rect.x + rect.w / 2 - w / 2,
        top: rect.y + rect.h / 2 - h / 2,
        width: w,
        height: h,
        transform: `rotate(${rotate}deg)`,
        filter: "drop-shadow(0 10px 14px rgba(0,0,0,0.8))",
      }}
    >
      <NoirCard card={card} team={team} className="block h-full w-full" />
    </div>
  );
};

/** Contorno da parte focada pelo tutorial. */
const FocusRing = ({ rect }: { rect: Rect }) => (
  <div
    className="pointer-events-none absolute animate-pulse rounded-2xl"
    style={{
      left: rect.x - 14,
      top: rect.y - 14,
      width: rect.w + 28,
      height: rect.h + 28,
      border: "5px solid #ffd45c",
      boxShadow: "0 0 30px rgba(255, 212, 92, 0.55)",
    }}
  />
);

/** Escurece a mesa fora da seleção (foco total): sombra enorme em volta do recorte. */
const FocusDim = ({ rect }: { rect: Rect }) => (
  <div
    className="pointer-events-none absolute rounded-2xl"
    style={{
      left: rect.x - 14,
      top: rect.y - 14,
      width: rect.w + 28,
      height: rect.h + 28,
      boxShadow: "0 0 0 3200px rgba(0, 0, 0, 0.5)",
    }}
  />
);

/** Contorno pulsante no slot sorteado pelo dado; recebe a carta arrastada. */
const SlotHighlight = ({
  rect,
  team,
  empty,
  acceptingDrop,
  onDropHandCard,
}: {
  rect: Rect;
  team: TeamName;
  empty: boolean;
  acceptingDrop: boolean;
  onDropHandCard?: (handIndex: number) => void;
}) => {
  const p = getPalette(team);
  const [over, setOver] = useState(false);
  return (
    <div
      className={`absolute flex items-center justify-center rounded-2xl ${over ? "" : "animate-pulse"}`}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes(HAND_CARD_DRAG)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const index = Number(e.dataTransfer.getData(HAND_CARD_DRAG));
        if (!Number.isNaN(index)) onDropHandCard?.(index);
      }}
      style={{
        left: rect.x - 8,
        top: rect.y - 8,
        width: rect.w + 16,
        height: rect.h + 16,
        // Só captura o mouse durante o arrasto, para não bloquear o clique na carta.
        pointerEvents: acceptingDrop ? "auto" : "none",
        border: `5px solid ${p.rim}`,
        background: over ? `${p.accent}33` : undefined,
        boxShadow: `0 0 ${over ? 70 : 40}px ${p.glow}, inset 0 0 30px ${p.glow}88`,
      }}
    >
      {empty ? (
        <span
          className="whitespace-nowrap text-2xl font-black tracking-[0.2em]"
          style={{ color: p.rim, transform: `rotate(${TEAM_CARD_ROTATION[team]}deg)` }}
        >
          POSICIONE AQUI
        </span>
      ) : (
        // Carta já no slot sorteado: dá para jogá-la.
        <span
          className="pointer-events-none whitespace-nowrap rounded-md px-3 py-1 text-xl font-black tracking-[0.15em]"
          style={{
            color: p.bg0,
            background: p.rim,
            transform: `rotate(${TEAM_CARD_ROTATION[team]}deg) translateY(110px)`,
          }}
        >
          CLIQUE PARA JOGAR
        </span>
      )}
    </div>
  );
};

/** Baralho do time: destaque suave para indicar que dá para comprar. */
const DeckHighlight = ({
  team,
  canBuy,
  strong,
  onClick,
}: {
  team: TeamName;
  canBuy: boolean;
  strong: boolean;
  onClick?: () => void;
}) => {
  const p = getPalette(team);
  const rect = deckRect(team);
  return (
    <div
      className={`absolute flex items-center justify-center rounded-xl ${
        canBuy ? "cursor-pointer transition-[filter] hover:brightness-150" : ""
      } ${strong ? "animate-pulse" : ""}`}
      onClick={canBuy ? onClick : undefined}
      style={{
        left: rect.x - 10,
        top: rect.y - 10,
        width: rect.w + 20,
        height: rect.h + 20,
        border: `${strong ? 5 : 3}px solid ${canBuy ? p.rim : "#ffffff22"}`,
        opacity: canBuy ? (strong ? 1 : 0.65) : 0.8,
        boxShadow: canBuy ? `0 0 ${strong ? 40 : 18}px ${p.glow}` : undefined,
      }}
    >
      <span
        className="whitespace-nowrap rounded bg-black/70 px-2 py-0.5 text-lg font-black tracking-[0.2em]"
        style={{ color: canBuy ? p.rim : "#a1a1aa", transform: `rotate(${TEAM_CARD_ROTATION[team]}deg)` }}
      >
        {canBuy ? "COMPRAR" : "MÃO CHEIA"}
      </span>
    </div>
  );
};

export type BoardStageProps = {
  turn: TeamName;
  shot: CameraShot;
  slots: Record<TeamName, (Card | null)[]>;
  combatCard?: { card: Card; team: TeamName } | null;
  /** Slot em destaque (ex.: sorteado pelo dado). */
  highlight?: { team: TeamName; index: number } | null;
  /** Pixels do rodapé cobertos por outra interface (ex.: inventário aberto). */
  bottomInset?: number;
  /** Foco pedido pelo tutorial; substitui a tomada normal. */
  cameraFocus?: CardCameraFocus | null;
  onSlotClick?: (team: TeamName, index: number) => void;
  /** Carta da mão (índice) solta sobre o slot em destaque. */
  onHandCardDrop?: (handIndex: number) => void;
  /** Baralho em destaque (hora de posicionar) e se dá para comprar. */
  deck?: { team: TeamName; canBuy: boolean; strong?: boolean } | null;
  onDeckClick?: () => void;
};

type CardLocation = { team: TeamName; index: number };

const HAND_DISTANCE = 300; // px do tabuleiro além da borda do jogador
const DROP_WINDOW_MS = 1500;

export const BoardStage = ({
  turn,
  shot,
  slots,
  combatCard,
  highlight,
  bottomInset = 0,
  cameraFocus = null,
  onSlotClick,
  onHandCardDrop,
  deck,
  onDeckClick,
}: BoardStageProps) => {
  /* ───────── Rastreio das cartas para animar de onde vieram ───────── */

  const locations = useRef<Map<string, CardLocation> | null>(null);
  const lastDrop = useRef<{ team: TeamName; at: number } | null>(null);
  const [handDrag, setHandDrag] = useState(false);

  // Depois de cada render, guarda em que slot cada carta está.
  useEffect(() => {
    const map = new Map<string, CardLocation>();
    (["police", "faction"] as TeamName[]).forEach((team) =>
      slots[team].forEach((card, index) => card && map.set(String(card.id), { team, index })),
    );
    locations.current = map;
  });

  // Arrasto de carta da mão: libera o slot em destaque para receber o drop.
  useEffect(() => {
    const start = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes(HAND_CARD_DRAG)) setHandDrag(true);
    };
    const end = () => setHandDrag(false);
    document.addEventListener("dragstart", start);
    document.addEventListener("dragend", end);
    document.addEventListener("drop", end);
    return () => {
      document.removeEventListener("dragstart", start);
      document.removeEventListener("dragend", end);
      document.removeEventListener("drop", end);
    };
  }, []);

  const slotEntrance = (team: TeamName, index: number, card: Card): CardEntrance | null => {
    const known = locations.current;
    if (!known) return null; // primeiro render: nada voa
    const rect = slotRect(team, index);
    const center = rectCenter(rect);
    const prev = known.get(String(card.id));
    const rotate = TEAM_CARD_ROTATION[team];

    // Mudou de slot (ex.: o campo se reorganizou): desliza do slot antigo.
    if (prev) {
      if (prev.index === index && prev.team === team) return null;
      const from = rectCenter(slotRect(prev.team, prev.index));
      return { dx: from.x - center.x, dy: from.y - center.y, z: 0, arc: 60, rotate, scale: 1, duration: 600 };
    }

    // Acabou de ser solta aqui pelo arrasto: só assenta na mesa.
    const drop = lastDrop.current;
    if (drop && drop.team === team && Date.now() - drop.at < DROP_WINDOW_MS) {
      return { dx: 0, dy: 0, z: 160, arc: 60, rotate, scale: 1.08, duration: 450 };
    }

    // Veio da mão: sai da borda do jogador, sobe e pousa no slot.
    const handX = team === "police" ? -HAND_DISTANCE : BOARD_W + HAND_DISTANCE;
    return {
      dx: handX - center.x,
      dy: 0,
      z: 260,
      arc: 340,
      rotate: rotate + (team === "police" ? -20 : 20),
      scale: 1.15,
      duration: 950,
    };
  };

  const combatEntrance = (card: Card, team: TeamName): CardEntrance | null => {
    const prev = locations.current?.get(String(card.id));
    if (!prev) return null;
    const fromRect = slotRect(prev.team, prev.index);
    const from = rectCenter(fromRect);
    const to = rectCenter(COMBAT_CARD);
    const fromBox = cardBox(fromRect, TEAM_CARD_ROTATION[team]);
    const toBox = cardBox(COMBAT_CARD, -6);
    // Sai do slot no tamanho dele e voa em arco até a zona de combate.
    return {
      dx: from.x - to.x,
      dy: from.y - to.y,
      z: 0,
      arc: 420,
      rotate: TEAM_CARD_ROTATION[team],
      scale: fromBox.w / toBox.w,
      duration: 1100,
      delay: 300,
    };
  };

  const handleDrop = (handIndex: number) => {
    if (highlight) lastDrop.current = { team: highlight.team, at: Date.now() };
    setHandDrag(false);
    onHandCardDrop?.(handIndex);
  };

  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ w: 1280, h: 720 });
  const [orbit, setOrbit] = useState<Orbit>(NO_ORBIT);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number; orbit: Orbit; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => setViewport({ w: el.clientWidth, h: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Nova tomada: a câmera volta ao enquadramento planejado.
  const focusKey = cameraFocus ? `${cameraFocus.area}-${cameraFocus.team}-${cameraFocus.slot}` : "";
  useEffect(() => setOrbit(NO_ORBIT), [shot, turn, focusKey]);

  // Roda do mouse aproxima/afasta (precisa de listener não passivo).
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setOrbit((o) => ({ ...o, zoom: clamp(o.zoom * Math.exp(-e.deltaY * 0.0012), ZOOM_RANGE) }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const framed = { w: viewport.w, h: Math.max(200, viewport.h - bottomInset) };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, orbit, moved: false };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    // Só vira arrasto depois de alguns pixels, para não engolir cliques.
    if (!d.moved) {
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6) return;
      d.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(true);
    }
    const pose = getPose(shot, turn, framed);
    setOrbit({
      ...d.orbit,
      // Arrastar para os lados gira em volta da mesa (360° livres).
      rotate: d.orbit.rotate + (e.clientX - d.x) * 0.35,
      // Arrastar para cima/baixo inclina a câmera.
      tilt: clamp(pose.tilt + d.orbit.tilt - (e.clientY - d.y) * 0.25, TILT_RANGE) - pose.tilt,
    });
  };

  const endDrag = () => {
    suppressClick.current = drag.current?.moved ?? false;
    drag.current = null;
    setDragging(false);
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    e.stopPropagation();
  };

  // Foco do tutorial: enquadra só a parte pedida.
  const target = cameraFocus ? focusTarget(cameraFocus) : null;
  const pose: CameraPose = target
    ? {
        focus: target.center,
        tilt: 30,
        rotate: target.rotate,
        scale: Math.min((framed.w * 0.84) / target.w, (framed.h * 0.76) / (target.h * Math.cos(Math.PI / 6))),
      }
    : getPose(cameraFocus?.area === "overview" ? "overview" : shot, turn, framed);
  const rotate = pose.rotate + orbit.rotate;
  const transform = [
    // Sobe o enquadramento acima da área coberta no rodapé.
    `translateY(${-bottomInset / 2}px)`,
    `rotateX(${pose.tilt + orbit.tilt}deg)`,
    `rotateZ(${rotate}deg)`,
    `scale(${pose.scale * orbit.zoom})`,
    `translate(${-pose.focus.x}px, ${-pose.focus.y}px)`,
  ].join(" ");

  return (
    <div
      ref={viewportRef}
      className={`relative h-full w-full overflow-hidden touch-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
      style={{ perspective: 1500, perspectiveOrigin: "50% 45%" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={onClickCapture}
    >
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: BOARD_W,
          height: BOARD_H,
          transformOrigin: "0 0",
          transformStyle: "preserve-3d",
          transform,
          transition: dragging ? "none" : "transform 1200ms cubic-bezier(0.65, 0.05, 0.36, 1)",
        }}
      >
        <TacticalBoard focus={shot === "focus" ? turn : null} className="absolute inset-0 h-full w-full" />

        {(["police", "faction"] as TeamName[]).map((team) =>
          slots[team].map((card, i) =>
            card ? (
              <CardOnBoard
                key={`${team}-${card.id}-${i}`}
                card={card}
                team={team}
                rect={slotRect(team, i)}
                rotate={TEAM_CARD_ROTATION[team]}
                entrance={slotEntrance(team, i, card)}
                onClick={onSlotClick ? () => onSlotClick(team, i) : undefined}
              />
            ) : null,
          ),
        )}

        {deck && (
          <DeckHighlight team={deck.team} canBuy={deck.canBuy} strong={!!deck.strong} onClick={onDeckClick} />
        )}

        {target && cameraFocus?.dim && <FocusDim rect={target.spotlight} />}
        {target && <FocusRing rect={target.spotlight} />}

        {highlight && (
          <SlotHighlight
            team={highlight.team}
            rect={slotRect(highlight.team, highlight.index)}
            empty={!slots[highlight.team][highlight.index]}
            acceptingDrop={handDrag}
            onDropHandCard={handleDrop}
          />
        )}

        {combatCard && (
          <CardOnBoard
            key={`combat-${combatCard.card.id}`}
            card={combatCard.card}
            team={combatCard.team}
            rect={COMBAT_CARD}
            rotate={-6}
            entrance={combatEntrance(combatCard.card, combatCard.team)}
          />
        )}

      </div>
    </div>
  );
};
