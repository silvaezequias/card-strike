import { RefObject, useLayoutEffect, useState } from "react";

type FitOptions = {
  /** Espaço reservado acima do conteúdo (barra de turno). */
  reserveTop: number;
  /** Espaço reservado abaixo (aba do inventário). */
  reserveBottom: number;
  /** Margem lateral total. */
  reserveX: number;
  minScale?: number;
};

/**
 * Escala o conteúdo para caber na janela sem rolar — útil em notebooks,
 * onde a altura útil fica entre ~600px e ~720px. Nunca amplia além de 1.
 */
export const useFitScale = (
  ref: RefObject<HTMLElement | null>,
  { reserveTop, reserveBottom, reserveX, minScale = 0.5 }: FitOptions,
) => {
  const [fit, setFit] = useState({ scale: 1, width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      // offset*/scroll* ignoram transform, então medem o tamanho natural.
      const width = el.scrollWidth;
      const height = el.scrollHeight;
      if (!width || !height) return;

      const availW = window.innerWidth - reserveX;
      const availH = window.innerHeight - reserveTop - reserveBottom;
      const scale = Math.max(minScale, Math.min(1, availW / width, availH / height));

      setFit((prev) =>
        prev.scale === scale && prev.width === width && prev.height === height
          ? prev
          : { scale, width, height },
      );
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [ref, reserveTop, reserveBottom, reserveX, minScale]);

  return fit;
};
