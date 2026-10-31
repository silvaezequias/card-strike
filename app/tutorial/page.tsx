"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { GraduationCap, Pencil, Play } from "lucide-react";
import { GameScreen } from "@/components/game/sci-fi-interface";
import { TutorialGateProvider } from "@/components/game/tutorial-gate";
import { TutorialDialog } from "@/components/tutorial/tutorial-dialog";
import { useNarrator } from "@/components/tutorial/use-narrator";
import { useTutorialRunner } from "@/components/tutorial/use-tutorial-runner";
import { Portrait } from "@/components/art/noir";
import { ScriptedOutcomes, useGameEngine } from "@/game/useGameEngine";
import { SetupSettings } from "@/game/game-types";
import { loadScript } from "@/lib/tutorial/storage";
import { TutorialStep, actionTeam } from "@/lib/tutorial/types";

/* Tutorial guiado: você joga de CT contra um bot, sem relógio e sem sorte. */

const SETUP: SetupSettings = {
  police: { playerName: "Você" },
  faction: { playerName: "Bot" },
};

export default function TutorialPage() {
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [started, setStarted] = useState(false);
  const outcomes = useRef<ScriptedOutcomes>({});

  useEffect(() => {
    loadScript().then((script) => setSteps(script.steps));
  }, []);

  const game = useGameEngine(SETUP, { timer: false, script: outcomes, startingCards: 0 });
  const runner = useTutorialRunner({ game, steps, outcomes, active: started });
  const narrator = useNarrator();
  const { speak } = narrator;

  // Cada passo novo é narrado (áudio do projeto ou voz do navegador).
  const speakStep = (step: TutorialStep) => speak(step.text, step.audioUrl);

  useEffect(() => {
    if (started && runner.step) speakStep(runner.step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, runner.index, runner.step?.id]);

  // Passos automáticos avançam quando a ação e a fala terminam.
  useEffect(() => {
    if (!runner.step || runner.step.advance !== "auto" || !runner.actionDone || narrator.speaking) return;
    const timer = window.setTimeout(runner.next, 700);
    return () => window.clearTimeout(timer);
  }, [runner.step, runner.actionDone, narrator.speaking, runner.next]);

  const isLast = runner.index >= runner.total - 1;
  const canContinue = !!runner.step && runner.actionDone && runner.step.advance === "click" && !isLast;

  return (
    <TutorialGateProvider value={runner.gate}>
      <GameScreen
        game={game}
        tutorialCamera={runner.camera}
        // Em falas e câmera ninguém está jogando: tabuleiro livre de painéis.
        hideBoardOverlays={!!runner.step && actionTeam(runner.step.action) === null}
        overlay={
          started && runner.step ? (
            <TutorialDialog
              step={runner.step}
              index={runner.index}
              total={runner.total}
              hint={runner.hint}
              canContinue={canContinue}
              speaking={narrator.speaking}
              muted={narrator.muted}
              onContinue={runner.next}
              onReplay={() => runner.step && speakStep(runner.step)}
              onToggleMute={() => {
                narrator.stop();
                narrator.setMuted((m) => !m);
              }}
            />
          ) : null
        }
      />

      {/* Tela inicial: o clique libera o áudio no navegador. */}
      {!started && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/90 font-mono backdrop-blur">
          <div className="flex max-w-3xl items-center gap-8 px-6">
            <Portrait team="police" variant={1} backdrop={false} flip className="hidden h-[60vh] w-auto md:block" />
            <div>
              <div className="flex items-center gap-2 text-xs font-bold tracking-[0.3em] text-sky-300">
                <GraduationCap size={16} /> TUTORIAL
              </div>
              <h1 className="mt-3 text-4xl font-black tracking-[0.2em] text-white">BEM-VINDO, RECRUTA</h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
                Você vai jogar de CT contra um bot. A Sargento Vega te guia passo a passo: nada de sorte,
                tudo acontece como no roteiro. Ligue o som!
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  disabled={steps.length === 0}
                  onClick={() => setStarted(true)}
                  className="flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-black tracking-[0.2em] text-black hover:bg-zinc-200 disabled:opacity-40"
                >
                  <Play size={16} /> COMEÇAR
                </button>
                <Link
                  href="/tutorial/editor"
                  className="flex items-center gap-2 rounded-lg border border-white/15 px-5 py-3 text-xs font-bold tracking-[0.2em] text-zinc-300 hover:border-white/40"
                >
                  <Pencil size={14} /> EDITAR ROTEIRO
                </Link>
                <Link href="/" className="px-3 py-3 text-xs font-bold tracking-[0.2em] text-zinc-500 hover:text-white">
                  VOLTAR
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </TutorialGateProvider>
  );
}
