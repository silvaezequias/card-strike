"use client";

import { useEffect, useRef } from "react";
import { ColorMode, useSettings } from "@/lib/settings";

/* ═══════════════════════════════════════════════
   AJUSTES DE TELA
   Valem para a página inteira: modo daltônico,
   brilho, contraste, saturação, desfoque da
   interface e o contador de FPS.

   Modo daltônico: a cor que a pessoa não distingue
   é simulada (Machado, 2009) e a diferença perdida
   é redistribuída para canais que ela enxerga
   (Fidaner).
   ═══════════════════════════════════════════════ */

const FILTER_ID = "card-strike-color-filter";
/** Classe no elemento raiz que tira o desfoque dos painéis (globals.css). */
const NO_BLUR_CLASS = "no-ui-blur";

/** Matriz 3×3 já pronta (linhas R, G, B) de cada tipo, com força total. */
const DALTONIZE: Record<Exclude<ColorMode, "off">, number[]> = {
  protanopia: [1, 0, 0, 0.4789, 0.4769, 0.0442, 0.5973, -0.6887, 1.0914],
  deuteranopia: [1.4366, -0.6314, 0.1948, 0, 1, 0, -0.1842, 0.1863, 0.9979],
  tritanopia: [0.7412, -0.4072, 0.666, 0.0751, 0.5852, 0.3397, 0, 0, 1],
};

const IDENTITY = [1, 0, 0, 0, 1, 0, 0, 0, 1];

/** Matriz do feColorMatrix (4×5), entre a cor original e a corrigida pela força. */
const filterMatrix = (mode: Exclude<ColorMode, "off">, strength: number) => {
  const m = DALTONIZE[mode].map(
    (v, i) => IDENTITY[i] + (v - IDENTITY[i]) * strength,
  );
  return [
    ...m.slice(0, 3),
    0,
    0,
    ...m.slice(3, 6),
    0,
    0,
    ...m.slice(6, 9),
    0,
    0,
    0,
    0,
    0,
    1,
    0,
  ]
    .map((v) => Math.round(v * 10000) / 10000)
    .join(" ");
};

/** Quadros por segundo, no canto superior esquerdo. */
const FpsCounter = () => {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let frames = 0;
    let since = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      frames++;
      if (now - since >= 500) {
        if (ref.current)
          ref.current.textContent = `${Math.round((frames * 1000) / (now - since))} FPS`;
        frames = 0;
        since = now;
      }
      frame = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <span
      ref={ref}
      className="pointer-events-none fixed left-2 top-2 z-[200] rounded bg-black/70 px-2 py-0.5 font-mono text-[11px] font-bold text-lime-300"
    >
      -- FPS
    </span>
  );
};

export const ScreenSettings = () => {
  const {
    colorMode,
    colorStrength,
    brightness,
    contrast,
    saturation,
    uiBlur,
    showFps,
  } = useSettings();
  const daltonize = colorMode !== "off" && colorStrength > 0;

  const filter = [
    daltonize && `url(#${FILTER_ID})`,
    brightness !== 1 && `brightness(${brightness})`,
    contrast !== 1 && `contrast(${contrast})`,
    saturation !== 1 && `saturate(${saturation})`,
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    const root = document.documentElement;
    // No elemento raiz o filtro não muda a posição de nada fixo na tela.
    root.style.filter = filter;
    return () => {
      root.style.filter = "";
    };
  }, [filter]);

  useEffect(() => {
    document.documentElement.classList.toggle(NO_BLUR_CLASS, !uiBlur);
  }, [uiBlur]);

  return (
    <>
      {daltonize && (
        <svg aria-hidden="true" className="pointer-events-none fixed h-0 w-0">
          <filter id={FILTER_ID} colorInterpolationFilters="linearRGB">
            <feColorMatrix
              type="matrix"
              values={filterMatrix(colorMode, colorStrength)}
            />
          </filter>
        </svg>
      )}
      {showFps && <FpsCounter />}
    </>
  );
};
