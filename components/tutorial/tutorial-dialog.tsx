"use client";

import Link from "next/link";
import { ChevronRight, MousePointerClick, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Portrait } from "@/components/art/noir";
import { policePalette } from "@/components/art/palette";
import { TutorialStep } from "@/lib/tutorial/types";

/** Caixa de fala da instrutora, no canto inferior esquerdo. */
export const TutorialDialog = ({
  step,
  index,
  total,
  hint,
  canContinue,
  speaking,
  muted,
  onContinue,
  onReplay,
  onToggleMute,
}: {
  step: TutorialStep;
  index: number;
  total: number;
  hint: string | null;
  canContinue: boolean;
  speaking: boolean;
  muted: boolean;
  onContinue: () => void;
  onReplay: () => void;
  onToggleMute: () => void;
}) => {
  const p = policePalette;
  const isFinish = step.action.kind === "finish";

  return (
    <div className="fixed bottom-4 left-4 z-[90] w-[min(440px,calc(100vw-2rem))] font-mono">
      <div
        className="relative overflow-hidden rounded-2xl border bg-black/85 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur"
        style={{ borderColor: `${p.accent}66` }}
      >
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${p.accent}, transparent)` }} />
        <div className="flex gap-3 p-4">
          <div
            className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 ${speaking ? "animate-pulse" : ""}`}
            style={{ borderColor: p.rim, boxShadow: `0 0 18px ${p.glow}88` }}
          >
            <Portrait team="police" variant={1} crop="head" flip className="h-full w-full" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-[0.25em]" style={{ color: p.rim }}>
                {step.speaker}
              </span>
              <span className="text-[10px] font-bold tracking-widest text-zinc-500">
                {index + 1}/{total}
              </span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-100">{step.text}</p>

            {hint && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-yellow-400/40 bg-yellow-400/10 px-3 py-2 text-xs font-bold tracking-wide text-yellow-200">
                <MousePointerClick size={14} className="flex-shrink-0" />
                {hint}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-white/10 px-4 py-2.5">
          <div className="flex gap-1">
            <button
              onClick={onReplay}
              title="Ouvir de novo"
              className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <RotateCcw size={15} />
            </button>
            <button
              onClick={onToggleMute}
              title={muted ? "Ligar voz" : "Desligar voz"}
              className="rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
            <Link
              href="/"
              className="rounded-md px-2 py-1.5 text-[10px] font-bold tracking-widest text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
            >
              PULAR
            </Link>
          </div>

          {isFinish ? (
            <div className="flex gap-2">
              <button
                onClick={() => window.location.reload()}
                className="rounded-md border border-white/15 px-3 py-1.5 text-[11px] font-bold tracking-widest text-zinc-300 hover:border-white/40"
              >
                REPETIR
              </button>
              <Link
                href="/"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-black tracking-widest text-black"
                style={{ background: p.rim }}
              >
                <Play size={13} /> JOGAR
              </Link>
            </div>
          ) : (
            canContinue && (
              <button
                onClick={onContinue}
                className="flex items-center gap-1 rounded-md px-3 py-1.5 text-[11px] font-black tracking-widest text-black"
                style={{ background: p.rim }}
              >
                CONTINUAR <ChevronRight size={14} />
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
