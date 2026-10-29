"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { TeamName } from "@/game/game-types";
import { Card } from "@/lib/types";
import { NoirCard } from "@/components/art/noir-card";
import { Portrait } from "@/components/art/noir";
import { getPalette } from "@/components/art/palette";
import {
  BOARD_H,
  BOARD_W,
  COMBAT_CARD,
  MAP_CENTER,
  MapSpot,
  Point,
  Rect,
  TEAM_CARD_ROTATION,
  TacticalBoard,
  gridFrame,
  routeBetween,
  slotRect,
  spotPoint,
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
const TEAM_VIEW_ROTATION: Record<TeamName, number> = { police: 90, faction: -90 };

type CameraPose = { focus: Point; tilt: number; rotate: number; scale: number };
type Orbit = { rotate: number; tilt: number; zoom: number };

const NO_ORBIT: Orbit = { rotate: 0, tilt: 0, zoom: 1 };
const TILT_RANGE = [8, 72] as const;
const ZOOM_RANGE = [0.5, 2.6] as const;

const clamp = (v: number, [min, max]: readonly [number, number]) => Math.min(max, Math.max(min, v));

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
   PEÃO — personagem em pé sobre uma base redonda,
   sempre virado para a câmera.
   ═══════════════════════════════════════════════ */

const PAWN_SPEED = 0.42; // px do tabuleiro por ms

const Pawn = ({
  team,
  spot,
  cameraRotate,
  instant,
  onArrive,
}: {
  team: TeamName;
  spot: MapSpot;
  cameraRotate: number;
  instant: boolean;
  onArrive?: () => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const current = useRef<MapSpot>(spot);
  const [walking, setWalking] = useState(false);
  const arriveRef = useRef(onArrive);
  arriveRef.current = onArrive;
  const p = getPalette(team);
  const start = spotPoint(team, spot);

  useEffect(() => {
    const el = ref.current;
    if (!el || current.current === spot) return;

    const route = routeBetween(team, current.current, spot);
    current.current = spot;

    // Duração proporcional ao caminho, com cada trecho na mesma velocidade.
    const lengths = route.slice(1).map((pt, i) => Math.hypot(pt.x - route[i].x, pt.y - route[i].y));
    const total = lengths.reduce((a, b) => a + b, 0) || 1;
    let walked = 0;
    const keyframes = route.map((pt, i) => {
      if (i > 0) walked += lengths[i - 1];
      return { transform: `translate(${pt.x}px, ${pt.y}px)`, offset: walked / total };
    });

    setWalking(true);
    const duration = Math.max(700, total / PAWN_SPEED);
    const animation = el.animate(keyframes, { duration, easing: "ease-in-out", fill: "forwards" });

    // O estilo inline já aponta para o destino (render do React); ao terminar
    // basta soltar a animação. O timer cobre abas em segundo plano, onde o
    // navegador pode não disparar `onfinish`.
    let arrived = false;
    const finish = () => {
      if (arrived) return;
      arrived = true;
      animation.cancel();
      setWalking(false);
      arriveRef.current?.();
    };
    animation.onfinish = finish;
    window.setTimeout(finish, duration + 80);
  }, [spot, team]);

  const face = (back: boolean) => (
    <div
      className="absolute inset-0 overflow-hidden rounded-t-[36px] rounded-b-md"
      style={{
        border: `3px solid ${p.accent}`,
        boxShadow: `0 0 18px ${p.glow}88`,
        backfaceVisibility: "hidden",
        transform: back ? "rotateY(180deg)" : undefined,
      }}
    >
      <Portrait team={team} crop="bust" className="block h-full w-full" />
    </div>
  );

  return (
    <div
      ref={ref}
      className="absolute left-0 top-0"
      style={{ transform: `translate(${start.x}px, ${start.y}px)`, transformStyle: "preserve-3d" }}
    >
      {/* Base no chão do tabuleiro */}
      <div
        className="absolute rounded-full"
        style={{
          width: 64,
          height: 64,
          left: -32,
          top: -32,
          background: `radial-gradient(circle, ${p.accent} 0 38%, ${p.bg2} 40% 100%)`,
          boxShadow: `0 0 0 3px ${p.rim}, 0 0 24px ${p.glow}`,
        }}
      />
      {/* Gira junto com a câmera para a figura ficar sempre de frente */}
      <div
        className="absolute left-0 top-0"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateZ(${-cameraRotate}deg)`,
          transition: instant ? "none" : "transform 1200ms cubic-bezier(0.65, 0.05, 0.36, 1)",
        }}
      >
        {/* Figura em pé (gira 90° para sair do plano) */}
        <div
          className="absolute"
          style={{
            width: 74,
            height: 96,
            left: -37,
            top: -96,
            transformOrigin: "50% 100%",
            transform: "rotateX(-90deg)",
            transformStyle: "preserve-3d",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              transformStyle: "preserve-3d",
              animation: walking ? "pawn-hop 340ms ease-in-out infinite" : undefined,
            }}
          >
            {face(false)}
            {face(true)}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   PALCO
   ═══════════════════════════════════════════════ */

/** Carta numa área do tabuleiro, girada para o seu jogador. */
const CardOnBoard = ({
  card,
  rect,
  team,
  rotate,
}: {
  card: Card;
  rect: Rect;
  team: TeamName;
  rotate: number;
}) => {
  // Em retrato a carta tem 3:4; girada ±90° ela ocupa o retângulo deitado.
  const sideways = Math.abs(rotate % 180) === 90;
  const w = (sideways ? rect.h : rect.w) * 0.9;
  const h = (sideways ? rect.w : rect.h) * 0.9;
  return (
    <div
      className="absolute"
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

export type BoardStageProps = {
  turn: TeamName;
  shot: CameraShot;
  positions: Record<TeamName, MapSpot>;
  slots: Record<TeamName, (Card | null)[]>;
  combatCard?: { card: Card; team: TeamName } | null;
  onPawnArrive?: (team: TeamName) => void;
};

export const BoardStage = ({
  turn,
  shot,
  positions,
  slots,
  combatCard,
  onPawnArrive,
}: BoardStageProps) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ w: 1280, h: 720 });
  const [orbit, setOrbit] = useState<Orbit>(NO_ORBIT);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number; orbit: Orbit } | null>(null);

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
  useEffect(() => setOrbit(NO_ORBIT), [shot, turn]);

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

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, orbit };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const pose = getPose(shot, turn, viewport);
    setOrbit({
      ...d.orbit,
      // Arrastar para os lados gira em volta da mesa (360° livres).
      rotate: d.orbit.rotate + (e.clientX - d.x) * 0.35,
      // Arrastar para cima/baixo inclina a câmera.
      tilt: clamp(pose.tilt + d.orbit.tilt - (e.clientY - d.y) * 0.25, TILT_RANGE) - pose.tilt,
    });
  };

  const endDrag = () => {
    drag.current = null;
    setDragging(false);
  };

  const pose = getPose(shot, turn, viewport);
  const rotate = pose.rotate + orbit.rotate;
  const transform = [
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
                key={`${team}-${i}`}
                card={card}
                team={team}
                rect={slotRect(team, i)}
                rotate={TEAM_CARD_ROTATION[team]}
              />
            ) : null,
          ),
        )}

        {combatCard && (
          <CardOnBoard card={combatCard.card} team={combatCard.team} rect={COMBAT_CARD} rotate={-6} />
        )}

        {(["faction", "police"] as TeamName[]).map((team) => (
          <Pawn
            key={team}
            team={team}
            spot={positions[team]}
            cameraRotate={rotate}
            instant={dragging}
            onArrive={() => onPawnArrive?.(team)}
          />
        ))}
      </div>
    </div>
  );
};
