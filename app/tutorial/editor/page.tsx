"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Copy,
  Music,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
  Volume2,
} from "lucide-react";
import { CARD_CATALOG } from "@/lib/card-catalog";
import {
  canEditProject,
  defaultScript,
  deleteAudio,
  loadScript,
  saveScript,
  uploadAudio,
} from "@/lib/tutorial/storage";
import {
  ACTION_LABELS,
  CardFocusArea,
  HUD_LABELS,
  HudElement,
  MapFocusArea,
  TutorialAction,
  TutorialActionKind,
  TutorialScript,
  TutorialStep,
  actionTeam,
  defaultAction,
} from "@/lib/tutorial/types";
import { useNarrator } from "@/components/tutorial/use-narrator";
import { Bombsite, TeamName } from "@/game/game-types";

/* Editor do roteiro do tutorial. Rodando com `npm run dev`, cada mudança é
   gravada em public/tutorial (roteiro e áudios) e entra no próximo commit. */

const newId = () => `step-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const cardsFor = (team: TeamName) => CARD_CATALOG.filter((c) => c.teams.includes(team)).map((c) => c.name);

/** Avisos de coerência: slot vazio na hora de jogar, carta substituída, etc. */
const lintSteps = (steps: TutorialStep[]) => {
  const occupied: Record<TeamName, Set<number>> = { police: new Set(), faction: new Set() };
  return steps.map((step) => {
    const a = step.action;
    const team = actionTeam(a);
    if (!team || a.kind === "camera" || !("slot" in a)) return null;
    let warning: string | null = null;
    if (a.kind.endsWith("play")) {
      if (!occupied[team].has(a.slot)) warning = `O slot ${a.slot} está vazio neste ponto do roteiro.`;
      occupied[team].delete(a.slot);
    } else {
      if (occupied[team].has(a.slot)) warning = `Já existe carta no slot ${a.slot}: ela será substituída.`;
      occupied[team].add(a.slot);
    }
    return warning;
  });
};

/** Opção do seletor para a câmera com foco total (`dim: true`). */
const CAMERA_TOTAL = "camera-total";

const CARD_AREAS: [CardFocusArea, string][] = [
  ["overview", "Visão geral da mesa"],
  ["side", "Campo da equipe (metade do tabuleiro)"],
  ["grid", "Grade de slots de um time"],
  ["slot", "Um slot específico"],
  ["deck", "Baralho de um time"],
  ["combat", "Zona de combate"],
  ["bomb", "Status da bomba"],
];

const MAP_AREAS: [MapFocusArea, string][] = [
  ["full", "Mapa inteiro"],
  ["side", "Campo da equipe (base, corredores e bombsites)"],
  ["sites", "Os 3 bombsites"],
  ["A", "Bombsite A"],
  ["B", "Bombsite B"],
  ["C", "Bombsite C"],
  ["base", "Base de um time"],
];

/** Texto da regra do passo de câmera. */
const describeCamera = (a: Extract<TutorialAction, { kind: "camera" }>) => {
  if (a.board === "hud") {
    return a.hud.length
      ? `Destaca na HUD: ${a.hud.map((k) => HUD_LABELS[k]).join(", ")}.`
      : "Nenhum elemento da HUD marcado.";
  }
  const team = a.team === "faction" ? "da Facção" : "da Polícia";
  if (a.board === "map") {
    if (a.area === "full") return "O mapa vai para o centro, sem zoom.";
    if (a.area === "side") return `O mapa vai para o centro destacando o campo ${team}: base, corredores e bombsites.`;
    if (a.area === "base") return `O mapa vai para o centro com zoom na base ${team}.`;
    if (a.area === "sites") return "O mapa vai para o centro destacando os bombsites A, B e C juntos.";
    return `O mapa vai para o centro com zoom no bombsite ${a.area}.`;
  }
  switch (a.area) {
    case "overview":
      return "A câmera mostra a mesa inteira.";
    case "side":
      return `A câmera mostra o campo ${team}: grade de slots, baralho de compra e faixa do time.`;
    case "grid":
      return `A câmera foca a grade de slots ${team}.`;
    case "slot":
      return `A câmera foca o slot ${a.slot ?? 1} ${team}.`;
    case "deck":
      return `A câmera foca o baralho ${team}.`;
    case "combat":
      return "A câmera foca a zona de combate.";
    default:
      return "A câmera foca o status da bomba.";
  }
};

const field =
  "w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/60 [color-scheme:dark] [&_option]:bg-neutral-900 [&_option]:text-zinc-100";
const label = "mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500";
const smallButton =
  "flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-1.5 text-[11px] font-bold tracking-widest text-zinc-300 transition-colors hover:border-white/40 hover:text-white disabled:opacity-40";

export default function TutorialEditorPage() {
  const [script, setScript] = useState<TutorialScript | null>(null);
  const [selected, setSelected] = useState(0);
  const [editable, setEditable] = useState<boolean | null>(null);
  const [status, setStatus] = useState<{ kind: "idle" | "saving" | "saved" | "error"; message?: string }>({
    kind: "idle",
  });
  const saveTimer = useRef<number | null>(null);
  const narrator = useNarrator();

  useEffect(() => {
    loadScript().then(setScript);
    canEditProject().then(setEditable);
  }, []);

  const steps = script?.steps ?? [];
  const step = steps[selected] as TutorialStep | undefined;
  const warnings = useMemo(() => lintSteps(steps), [steps]);

  // Grava no projeto um pouco depois da última mudança (digitar não salva a cada tecla).
  const commit = (next: TutorialStep[]) => {
    const updated: TutorialScript = { version: 1, steps: next };
    setScript(updated);
    setStatus({ kind: "saving" });
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveScript(updated)
        .then(() => setStatus({ kind: "saved" }))
        .catch((err: Error) => setStatus({ kind: "error", message: err.message }));
    }, 500);
  };

  const reportError = (err: unknown) =>
    setStatus({ kind: "error", message: err instanceof Error ? err.message : "Algo deu errado." });

  const updateStep = (patch: Partial<TutorialStep>) => {
    if (!step) return;
    commit(steps.map((s, i) => (i === selected ? { ...s, ...patch } : s)));
  };

  const updateAction = (patch: Partial<TutorialAction>) =>
    step && updateStep({ action: { ...step.action, ...patch } as TutorialAction });

  const addStep = () => {
    const blank: TutorialStep = {
      id: newId(),
      label: "Novo passo",
      speaker: step?.speaker ?? "Sargento Vega",
      text: "",
      action: { kind: "narration" },
      advance: "click",
    };
    const next = [...steps];
    next.splice(selected + 1, 0, blank);
    commit(next);
    setSelected(selected + 1);
  };

  const duplicateStep = () => {
    if (!step) return;
    const next = [...steps];
    next.splice(selected + 1, 0, { ...structuredClone(step), id: newId(), audioUrl: null });
    commit(next);
    setSelected(selected + 1);
  };

  const removeStep = async () => {
    if (!step || steps.length <= 1) return;
    if (step.audioUrl) await deleteAudio(step.audioUrl).catch(() => {});
    commit(steps.filter((_, i) => i !== selected));
    setSelected(Math.max(0, selected - 1));
  };

  const moveStep = (delta: number) => {
    const target = selected + delta;
    if (!step || target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[selected], next[target]] = [next[target], next[selected]];
    commit(next);
    setSelected(target);
  };

  // O arquivo vai para public/tutorial/audio; o áudio antigo do passo é apagado.
  const handleAudioUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !step) return;
    try {
      setStatus({ kind: "saving" });
      const url = await uploadAudio(step.id, file);
      if (step.audioUrl) await deleteAudio(step.audioUrl).catch(() => {});
      updateStep({ audioUrl: url });
    } catch (err) {
      reportError(err);
    }
  };

  const removeAudio = async () => {
    if (!step?.audioUrl) return;
    try {
      await deleteAudio(step.audioUrl);
      updateStep({ audioUrl: null });
    } catch (err) {
      reportError(err);
    }
  };

  const handleReset = () => {
    if (!confirm("Voltar para o roteiro padrão? As mudanças no roteiro serão perdidas (os áudios continuam na pasta).")) return;
    commit(defaultScript().steps);
    setSelected(0);
  };

  if (!script) return <div className="h-screen bg-neutral-950" />;

  const a = step?.action;
  const team = a ? actionTeam(a) : null;

  return (
    <div className="flex h-screen flex-col bg-neutral-950 font-mono text-white">
      {/* Barra superior */}
      <header className="flex flex-wrap items-center gap-3 border-b border-white/10 px-5 py-3">
        <Link href="/tutorial" className="flex items-center gap-2 text-xs font-bold tracking-widest text-zinc-400 hover:text-white">
          <ArrowLeft size={14} /> TUTORIAL
        </Link>
        <h1 className="text-lg font-black tracking-[0.25em]">EDITOR DO TUTORIAL</h1>
        <span className={`text-[10px] tracking-widest ${status.kind === "error" ? "text-red-300" : "text-zinc-500"}`}>
          {status.kind === "saving" && "SALVANDO..."}
          {status.kind === "saved" && "SALVO EM public/tutorial"}
          {status.kind === "error" && `ERRO: ${status.message}`}
          {status.kind === "idle" && `${steps.length} PASSOS`}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Link href="/tutorial" className={`${smallButton} border-sky-400/50 text-sky-200`}>
            <Play size={13} /> TESTAR
          </Link>
          <button onClick={handleReset} disabled={!editable} className={smallButton}>
            <RotateCcw size={13} /> PADRÃO
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Lista de passos */}
        <aside className="flex w-80 flex-shrink-0 flex-col border-r border-white/10">
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {steps.map((s, i) => {
              const t = actionTeam(s.action);
              return (
                <button
                  key={s.id}
                  onClick={() => setSelected(i)}
                  className={`mb-1 flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                    i === selected ? "border-sky-400/60 bg-sky-400/10" : "border-transparent hover:bg-white/5"
                  }`}
                >
                  <span className="mt-0.5 w-5 text-right text-xs font-black text-zinc-500">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-zinc-100">{s.label || "(sem nome)"}</span>
                    <span
                      className={`text-[10px] font-bold tracking-widest ${
                        t === "police" ? "text-sky-300" : t === "faction" ? "text-red-300" : "text-zinc-500"
                      }`}
                    >
                      {(s.action.kind === "camera" && s.action.dim
                        ? "Câmera com foco total"
                        : ACTION_LABELS[s.action.kind]
                      ).toUpperCase()}
                    </span>
                  </span>
                  {s.audioUrl && <Music size={13} className="mt-1 text-emerald-300" />}
                  {warnings[i] && <AlertTriangle size={13} className="mt-1 text-amber-300" />}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-1.5 border-t border-white/10 p-2">
            <button onClick={addStep} className={smallButton}>
              <Plus size={13} /> NOVO
            </button>
            <button onClick={duplicateStep} className={smallButton} title="Duplicar">
              <Copy size={13} />
            </button>
            <button onClick={() => moveStep(-1)} disabled={selected === 0} className={smallButton} title="Subir">
              <ArrowUp size={13} />
            </button>
            <button onClick={() => moveStep(1)} disabled={selected === steps.length - 1} className={smallButton} title="Descer">
              <ArrowDown size={13} />
            </button>
            <button onClick={removeStep} disabled={steps.length <= 1} className={`${smallButton} hover:border-red-400/60 hover:text-red-300`} title="Excluir">
              <Trash2 size={13} />
            </button>
          </div>
        </aside>

        {/* Passo selecionado */}
        {step && a && (
          <main className="min-h-0 flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-3xl space-y-6">
              {editable === false && (
                <p className="flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-xs text-amber-200">
                  <AlertTriangle size={15} className="flex-shrink-0" />
                  Somente leitura: o editor só grava no projeto rodando localmente com npm run dev.
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className={label}>Nome do passo (só no editor)</span>
                  <input className={field} value={step.label} onChange={(e) => updateStep({ label: e.target.value })} />
                </div>
                <div>
                  <span className={label}>Quem fala</span>
                  <input className={field} value={step.speaker} onChange={(e) => updateStep({ speaker: e.target.value })} />
                </div>
              </div>

              <div>
                <span className={label}>Fala (aparece na tela e é narrada)</span>
                <textarea
                  className={`${field} min-h-28 leading-relaxed`}
                  value={step.text}
                  onChange={(e) => updateStep({ text: e.target.value })}
                />
              </div>

              {/* Regra do passo */}
              <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <h2 className="mb-4 text-xs font-black tracking-[0.25em] text-zinc-300">REGRA DESTE PASSO</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <span className={label}>O que acontece</span>
                    <select
                      className={field}
                      value={a.kind === "camera" && a.dim ? CAMERA_TOTAL : a.kind}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Foco total é a câmera com foco escurecendo o resto: só muda a opção.
                        if (a.kind === "camera" && (value === "camera" || value === CAMERA_TOTAL)) {
                          updateAction({ dim: value === CAMERA_TOTAL } as Partial<TutorialAction>);
                          return;
                        }
                        const kind = (value === CAMERA_TOTAL ? "camera" : value) as TutorialActionKind;
                        const action = defaultAction(kind);
                        updateStep({
                          action: kind === "camera" ? ({ ...action, dim: value === CAMERA_TOTAL } as TutorialAction) : action,
                          advance: kind === "narration" || kind === "camera" || kind === "finish" ? "click" : "auto",
                        });
                      }}
                    >
                      {Object.entries(ACTION_LABELS).map(([kind, text]) => [
                        <option key={kind} value={kind}>
                          {text}
                        </option>,
                        kind === "camera" && (
                          <option key={CAMERA_TOTAL} value={CAMERA_TOTAL}>
                            Câmera com foco total
                          </option>
                        ),
                      ])}
                    </select>
                  </div>

                  {"site" in a && (
                    <div className="sm:col-span-2">
                      <span className={label}>Resultado da roleta (bombsite)</span>
                      <div className="flex gap-2">
                        {(["A", "B", "C"] as Bombsite[]).map((s) => (
                          <button
                            key={s}
                            onClick={() => updateAction({ site: s })}
                            className={`h-12 w-16 rounded-lg border text-xl font-black ${
                              a.site === s ? "border-sky-400 bg-sky-400/20 text-white" : "border-white/15 text-zinc-400 hover:border-white/40"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {"slot" in a && a.kind !== "camera" && (
                    <div className="sm:col-span-2">
                      <span className={label}>Resultado do dado (slot)</span>
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                          <button
                            key={n}
                            onClick={() => updateAction({ slot: n })}
                            className={`h-12 w-12 rounded-lg border text-lg font-black ${
                              a.slot === n ? "border-sky-400 bg-sky-400/20 text-white" : "border-white/15 text-zinc-400 hover:border-white/40"
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {"card" in a && team && (
                    <div className="sm:col-span-2">
                      <span className={label}>Carta comprada no baralho</span>
                      <select className={field} value={a.card} onChange={(e) => updateAction({ card: e.target.value })}>
                        {cardsFor(team).map((name) => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {a.kind === "camera" && (
                    <>
                      <div className="sm:col-span-2">
                        <span className={label}>Tipo de foco</span>
                        <div className="flex gap-2">
                          {(
                            [
                              ["board", "Foco em tabuleiro"],
                              ["hud", "Foco na HUD"],
                            ] as const
                          ).map(([type, text]) => (
                            <button
                              key={type}
                              onClick={() =>
                                updateStep({
                                  action:
                                    type === "hud"
                                      ? { kind: "camera", board: "hud", hud: ["player-police"], dim: a.dim }
                                      : { kind: "camera", board: "cards", area: "grid", team: "police", dim: a.dim },
                                })
                              }
                              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-bold ${
                                (a.board === "hud") === (type === "hud")
                                  ? "border-sky-400 bg-sky-400/15 text-white"
                                  : "border-white/15 text-zinc-400 hover:border-white/40"
                              }`}
                            >
                              {text}
                            </button>
                          ))}
                        </div>
                      </div>

                      {a.board === "hud" ? (
                        <div className="sm:col-span-2">
                          <span className={label}>Elementos da HUD para deixar visíveis e focar</span>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {(Object.entries(HUD_LABELS) as [HudElement, string][]).map(([key, text]) => {
                              const on = a.hud.includes(key);
                              return (
                                <label
                                  key={key}
                                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                                    on ? "border-sky-400 bg-sky-400/15 text-white" : "border-white/15 text-zinc-400 hover:border-white/40"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="accent-sky-400"
                                    checked={on}
                                    onChange={() =>
                                      updateAction({
                                        hud: on ? a.hud.filter((k) => k !== key) : [...a.hud, key],
                                      } as Partial<TutorialAction>)
                                    }
                                  />
                                  {text}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <>
                        <div className="sm:col-span-2">
                          <span className={label}>Tabuleiro</span>
                          <div className="flex gap-2">
                            {(
                              [
                                ["cards", "Tabuleiro de cartas"],
                                ["map", "Mapa tático"],
                              ] as const
                            ).map(([board, text]) => (
                              <button
                                key={board}
                                onClick={() =>
                                  updateStep({
                                    action:
                                      board === "cards"
                                        ? { kind: "camera", board, area: "grid", team: a.team ?? "police", dim: a.dim }
                                        : { kind: "camera", board, area: "full", dim: a.dim },
                                  })
                                }
                                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-bold ${
                                  a.board === board ? "border-sky-400 bg-sky-400/15 text-white" : "border-white/15 text-zinc-400 hover:border-white/40"
                                }`}
                              >
                                {text}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className={label}>Focar em</span>
                          <select
                            className={field}
                            value={a.area}
                            onChange={(e) => updateAction({ area: e.target.value } as Partial<TutorialAction>)}
                          >
                            {(a.board === "cards" ? CARD_AREAS : MAP_AREAS).map(([value, text]) => (
                              <option key={value} value={value}>
                                {text}
                              </option>
                            ))}
                          </select>
                        </div>

                        {["side", "grid", "slot", "deck", "base"].includes(a.area) && (
                          <div>
                            <span className={label}>Time</span>
                            <select
                              className={field}
                              value={a.team ?? "police"}
                              onChange={(e) => updateAction({ team: e.target.value as TeamName })}
                            >
                              <option value="police">Polícia (jogador)</option>
                              <option value="faction">Facção (bot)</option>
                            </select>
                          </div>
                        )}

                        {a.board === "cards" && a.area === "slot" && (
                          <div className="sm:col-span-2">
                            <span className={label}>Slot</span>
                            <div className="flex flex-wrap gap-2">
                              {[1, 2, 3, 4, 5, 6].map((n) => (
                                <button
                                  key={n}
                                  onClick={() => updateAction({ slot: n } as Partial<TutorialAction>)}
                                  className={`h-12 w-12 rounded-lg border text-lg font-black ${
                                    (a.slot ?? 1) === n ? "border-sky-400 bg-sky-400/20 text-white" : "border-white/15 text-zinc-400 hover:border-white/40"
                                  }`}
                                >
                                  {n}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        </>
                      )}
                    </>
                  )}

                  <div className="sm:col-span-2">
                    <span className={label}>Avançar para o próximo passo</span>
                    <div className="flex gap-2">
                      {(
                        [
                          ["auto", "Sozinho, quando a ação e a fala terminarem"],
                          ["click", "Quando o jogador clicar em Continuar"],
                        ] as const
                      ).map(([value, text]) => (
                        <button
                          key={value}
                          onClick={() => updateStep({ advance: value })}
                          className={`flex-1 rounded-lg border px-3 py-2 text-left text-xs ${
                            step.advance === value ? "border-sky-400 bg-sky-400/15 text-white" : "border-white/15 text-zinc-400 hover:border-white/40"
                          }`}
                        >
                          {text}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-xs leading-relaxed text-zinc-500">
                  {a.kind === "narration" && "Nada acontece no jogo: o jogador só lê/ouve e continua."}
                  {a.kind === "camera" &&
                    `${describeCamera(a)}${a.dim ? (a.board === "hud" ? " O resto da tela escurece." : " O resto do tabuleiro escurece.") : ""} Nada mais acontece no jogo.`}
                  {a.kind === "finish" && "Mostra os botões Jogar e Repetir."}
                  {a.kind === "opponent-move" && `O bot escolhe Se Posicionar e a roleta cai no bombsite ${a.site}.`}
                  {a.kind === "opponent-place" &&
                    `O bot rola o dado (cai no ${a.slot}), compra ${a.card} se não tiver na mão e posiciona no slot ${a.slot}.`}
                  {a.kind === "opponent-play" && `O bot rola o dado (cai no ${a.slot}) e joga a carta desse slot.`}
                  {a.kind === "player-move" &&
                    `Só "Se posicionar" fica liberado; a roleta cai no bombsite ${a.site}.`}
                  {a.kind === "player-place" &&
                    `Só "Posicionar carta" fica liberado; o dado cai no ${a.slot}, o baralho entrega ${a.card} e o jogador posiciona no slot.`}
                  {a.kind === "player-play" &&
                    `Só "Posicionar carta" fica liberado; o dado cai no ${a.slot} e o jogador precisa clicar na carta desse slot.`}
                  {team && " Se o turno for do outro time, a vez passa sozinha antes."}
                </p>
                {warnings[selected] && (
                  <p className="mt-3 flex items-center gap-2 rounded-md border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
                    <AlertTriangle size={14} /> {warnings[selected]}
                  </p>
                )}
              </section>

              {/* Áudio */}
              <section className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <h2 className="mb-1 text-xs font-black tracking-[0.25em] text-zinc-300">ÁUDIO DA FALA</h2>
                <p className="mb-4 text-xs text-zinc-500">
                  Sem áudio, a fala é lida pela voz do navegador. Envie um arquivo (MP3, WAV, OGG...) para usar a sua
                  gravação: ele é salvo em public/tutorial/audio e vai junto no commit.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <label className={`${smallButton} ${editable ? "cursor-pointer" : "pointer-events-none opacity-40"}`}>
                    <Upload size={13} /> {step.audioUrl ? "TROCAR ÁUDIO" : "ENVIAR ÁUDIO"}
                    <input type="file" accept="audio/*" hidden disabled={!editable} onChange={handleAudioUpload} />
                  </label>
                  {step.audioUrl && (
                    <button onClick={removeAudio} className={`${smallButton} hover:border-red-400/60 hover:text-red-300`}>
                      <Trash2 size={13} /> REMOVER
                    </button>
                  )}
                  {!step.audioUrl && (
                    <button onClick={() => narrator.speak(step.text)} disabled={!step.text} className={smallButton}>
                      <Volume2 size={13} /> OUVIR VOZ DO NAVEGADOR
                    </button>
                  )}
                </div>
                {step.audioUrl && (
                  <>
                    <audio key={step.audioUrl} src={step.audioUrl} controls className="mt-4 w-full" />
                    <p className="mt-2 text-[11px] text-zinc-500">Arquivo: public{step.audioUrl}</p>
                  </>
                )}
              </section>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
