"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getPalette } from "@/components/art/palette";
import { TeamName } from "@/game/game-types";
import {
  DICE_FPS,
  DIE_SIZE,
  DiceFrame,
  quaternionToMatrix,
  simulateThrow,
} from "@/lib/dice-physics";
import { gridFrame } from "@/components/art/tactical-board";

/* ═══════════════════════════════════════════════
   DADO 3D
   Um cubo em CSS dentro do plano do tabuleiro: usa a
   mesma câmera e perspectiva das cartas. Balança no
   ar enquanto o jogador segura e rola sobre a grade
   dele quando é lançado.
   ═══════════════════════════════════════════════ */

const HALF = DIE_SIZE / 2;
const HOLD_HEIGHT = 230;
const HOLD_OUTSIDE = 90; // além da borda da grade, do lado do jogador
const THROW_SPEED = 620;
const SIDE_SPEED = 260;
const SHAKE_RADIUS = 30;
const REST_MS = 1300;

const FACE_TRANSFORM: Record<number, string> = {
  1: "rotateY(0deg)",
  6: "rotateY(180deg)",
  3: "rotateY(90deg)",
  4: "rotateY(-90deg)",
  2: "rotateX(-90deg)",
  5: "rotateX(90deg)",
};

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[26, 26], [50, 50], [74, 74]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]],
  6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]],
};

const throwSetup = (team: TeamName) => {
  const grid = gridFrame(team);
  // A grade é vista deitada: a profundidade corre em x e a largura em y.
  const dir = team === "police" ? 1 : -1;
  return {
    dir,
    hold: {
      x: grid.center.x - dir * (grid.h / 2 + HOLD_OUTSIDE),
      y: grid.center.y,
      z: HOLD_HEIGHT,
    },
    bounds: {
      x0: grid.center.x - grid.h / 2 - HOLD_OUTSIDE * 2,
      x1: grid.center.x + grid.h / 2,
      y0: grid.center.y - grid.w / 2,
      y1: grid.center.y + grid.w / 2,
    },
  };
};

export type DiceRoll = { id: number; value: number; team: TeamName };

export const BoardDice = ({
  team,
  shaking,
  roll,
  onHit,
  onSettled,
}: {
  team: TeamName;
  shaking: boolean;
  roll: DiceRoll | null;
  /** Dado bateu na mesa. */
  onHit?: () => void;
  onSettled: () => void;
}) => {
  const p = getPalette(roll?.team ?? team);
  const cube = useRef<HTMLDivElement>(null);
  const shadow = useRef<HTMLDivElement>(null);
  const [resting, setResting] = useState<number | null>(null);
  const [finished, setFinished] = useState<number | null>(null);
  const settledRef = useRef(onSettled);
  settledRef.current = onSettled;
  const hitRef = useRef(onHit);
  hitRef.current = onHit;

  const place = (frame: DiceFrame) => {
    if (cube.current) {
      cube.current.style.transform = `translate3d(${frame.x - HALF}px, ${frame.y - HALF}px, ${frame.z}px) matrix3d(${quaternionToMatrix(frame.q)})`;
    }
    if (shadow.current) {
      const spread = 1 + frame.z / 220;
      shadow.current.style.transform = `translate3d(${frame.x - HALF}px, ${frame.y - HALF}px, 1px) scale(${spread})`;
      shadow.current.style.opacity = String(Math.max(0.2, 0.7 - frame.z / 500));
    }
  };

  const rollId = roll?.id;
  const flight = useMemo(() => {
    if (!roll) return null;
    const setup = throwSetup(roll.team);
    return simulateThrow({
      start: setup.hold,
      velocity: {
        x: setup.dir * THROW_SPEED,
        y: (Math.random() - 0.5) * 2 * SIDE_SPEED,
        z: -120,
      },
      bounds: setup.bounds,
      value: roll.value,
    });
    // Cada jogada simula uma vez só.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rollId]);

  // Balançando na mão, antes de lançar.
  useEffect(() => {
    if (!shaking) return;
    const { hold } = throwSetup(team);
    let frame = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const t = (now - started) / 1000;
      const angle = t * 9;
      const half = angle / 2;
      const norm = Math.hypot(1, 0.7, 0.4);
      const s = Math.sin(half) / norm;
      place({
        x: hold.x + Math.sin(t * 31) * SHAKE_RADIUS,
        y: hold.y + Math.cos(t * 27) * SHAKE_RADIUS,
        z: hold.z + Math.sin(t * 23) * SHAKE_RADIUS * 0.7,
        q: [s, s * 0.7, s * 0.4, Math.cos(half)],
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [shaking, team]);

  // Replay da jogada simulada.
  useEffect(() => {
    if (!flight || !rollId) return;
    const { frames, hits } = flight;
    const pendingHits = [...hits];
    let frame = 0;
    const started = performance.now();

    const tick = (now: number) => {
      // O primeiro quadro pode trazer um horário anterior ao início.
      const index = Math.max(0, Math.floor(((now - started) / 1000) * DICE_FPS));
      while (pendingHits.length && pendingHits[0] <= index) {
        pendingHits.shift();
        hitRef.current?.();
      }
      place(frames[Math.min(index, frames.length - 1)]);
      if (index < frames.length - 1) {
        frame = requestAnimationFrame(tick);
        return;
      }
      setResting(rollId);
      setFinished(rollId);
      settledRef.current();
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [flight, rollId]);

  // Fica um instante na mesa para o número ser lido.
  useEffect(() => {
    if (!resting) return;
    const timer = window.setTimeout(() => setResting(null), REST_MS);
    return () => window.clearTimeout(timer);
  }, [resting]);

  const flying = !!roll && finished !== roll.id;
  if (!shaking && !flying && !resting) return null;

  return (
    <>
      <div
        ref={shadow}
        className="pointer-events-none absolute left-0 top-0 rounded-full"
        style={{
          width: DIE_SIZE,
          height: DIE_SIZE,
          background: "radial-gradient(circle, rgba(0,0,0,0.85) 30%, rgba(0,0,0,0) 72%)",
        }}
      />
      <div
        ref={cube}
        className="pointer-events-none absolute left-0 top-0"
        style={{ width: DIE_SIZE, height: DIE_SIZE, transformStyle: "preserve-3d" }}
      >
        {Object.entries(PIPS).map(([value, pips]) => (
          <div
            key={value}
            className="absolute inset-0"
            style={{
              transform: `${FACE_TRANSFORM[Number(value)]} translateZ(${HALF}px)`,
              borderRadius: "16%",
              background: `linear-gradient(145deg, ${p.bg2}, ${p.bg0})`,
              boxShadow: `inset 0 0 0 3px ${p.rim}, inset 0 0 14px ${p.glow}`,
            }}
          >
            {pips.map(([x, y]) => (
              <span
                key={`${x}-${y}`}
                className="absolute rounded-full bg-white"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: "19%",
                  height: "19%",
                  transform: "translate(-50%, -50%)",
                  boxShadow: `0 0 6px ${p.rim}`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </>
  );
};
