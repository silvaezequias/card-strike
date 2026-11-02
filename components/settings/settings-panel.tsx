"use client";

import { CSSProperties, ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { RotateCcw, Settings as SettingsIcon, Volume2, VolumeX, X } from "lucide-react";
import { factionPalette, policePalette } from "@/components/art/palette";
import { ColorMode, Settings, resetSettings, updateSettings, useSettings } from "@/lib/settings";

/* ═══════════════════════════════════════════════
   CONFIGURAÇÕES
   Abas de áudio, vídeo, gráficos e acessibilidade.
   Tudo muda na hora e fica salvo no navegador.
   ═══════════════════════════════════════════════ */

const ACCENT = "#c9bcff";

type Tab = "audio" | "video" | "graphics" | "access";

const TABS: { id: Tab; label: string }[] = [
  { id: "audio", label: "Áudio" },
  { id: "video", label: "Vídeo" },
  { id: "graphics", label: "Gráficos" },
  { id: "access", label: "Acessibilidade" },
];

const COLOR_MODES: { mode: ColorMode; label: string; hint: string }[] = [
  { mode: "off", label: "Desligado", hint: "Cores originais" },
  { mode: "protanopia", label: "Protanopia", hint: "Pouca sensibilidade ao vermelho" },
  { mode: "deuteranopia", label: "Deuteranopia", hint: "Pouca sensibilidade ao verde" },
  { mode: "tritanopia", label: "Tritanopia", hint: "Pouca sensibilidade ao azul" },
];

/** Cores que o jogo precisa separar, para ver o efeito do modo daltônico na hora. */
const SWATCHES = [
  { label: "Polícia", color: policePalette.rim },
  { label: "Facção", color: factionPalette.rim },
  { label: "Vida", color: "#5cffa8" },
  { label: "Dano", color: "#ff5c70" },
  { label: "Conflito", color: "#ffb020" },
];

/** Volumes com o campo do valor e o do mudo de cada um. */
const VOLUMES: { label: string; value: keyof Settings; muted: keyof Settings }[] = [
  { label: "Volume geral", value: "master", muted: "muted" },
  { label: "Efeitos sonoros", value: "effects", muted: "effectsMuted" },
  { label: "Música do menu", value: "menuMusic", muted: "menuMusicMuted" },
  { label: "Música da partida", value: "gameMusic", muted: "gameMusicMuted" },
  { label: "Narração (tutorial)", value: "narration", muted: "narrationMuted" },
];

const set = (changes: Partial<Settings>) => updateSettings(changes);
const percent = (value: number) => `${Math.round(value * 100)}%`;

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="flex flex-col gap-3">
    <h3 className="text-[10px] font-bold tracking-[0.4em] text-zinc-400">{title}</h3>
    {children}
  </section>
);

const Slider = ({
  label,
  value,
  min = 0,
  max = 1,
  disabled = false,
  onChange,
  before,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  /** Controle à esquerda do nome (ex.: botão de mudo). */
  before?: ReactNode;
}) => {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex items-center gap-3">
      {before}
      <label className={`flex min-w-0 flex-1 items-center gap-4 ${disabled ? "opacity-40" : ""}`}>
        <span className="w-36 shrink-0 text-xs font-bold uppercase tracking-widest text-zinc-200">{label}</span>
        <input
          type="range"
          min={Math.round(min * 100)}
          max={Math.round(max * 100)}
          step={5}
          value={Math.round(value * 100)}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          className="settings-range h-1.5 min-w-0 flex-1 cursor-pointer"
          style={{ "--fill": `${fill}%` } as CSSProperties}
        />
        <span className="w-10 shrink-0 text-right font-mono text-xs text-zinc-300">{percent(value)}</span>
      </label>
    </div>
  );
};

const MuteButton = ({ label, muted, onToggle }: { label: string; muted: boolean; onToggle: () => void }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-pressed={muted}
    aria-label={muted ? `Ligar ${label}` : `Mutar ${label}`}
    title={muted ? "Ligar" : "Mutar"}
    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors"
    style={{
      borderColor: muted ? "#ef4444" : "rgba(255,255,255,0.15)",
      color: muted ? "#fca5a5" : "#e4e4e7",
      background: muted ? "rgba(239,68,68,0.15)" : "rgba(0,0,0,0.3)",
    }}
  >
    {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
  </button>
);

const Toggle = ({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="flex items-center gap-4 rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-left transition-colors hover:border-white/25"
  >
    <span className="flex-1">
      <span className="block text-xs font-bold uppercase tracking-widest text-zinc-200">{label}</span>
      <span className="block text-[11px] text-zinc-400">{hint}</span>
    </span>
    <span className="relative h-5 w-9 shrink-0 rounded-full transition-colors" style={{ background: checked ? ACCENT : "#3f3f46" }}>
      <span className="absolute top-0.5 h-4 w-4 rounded-full bg-[#07060c] transition-all" style={{ left: checked ? 18 : 2 }} />
    </span>
  </button>
);

const AudioTab = ({ settings }: { settings: Settings }) => (
  <Section title="VOLUMES">
    {VOLUMES.map(({ label, value, muted }) => {
      const isMuted = settings[muted] as boolean;
      // Geral mutado cala tudo: os outros ficam apagados.
      const silencedByMaster = muted !== "muted" && settings.muted;
      return (
        <Slider
          key={value}
          label={label}
          value={settings[value] as number}
          disabled={isMuted || silencedByMaster}
          onChange={(v) => set({ [value]: v })}
          before={<MuteButton label={label} muted={isMuted} onToggle={() => set({ [muted]: !isMuted })} />}
        />
      );
    })}
    <p className="text-[11px] text-zinc-500">
      O volume geral multiplica os outros. Mutar o geral cala todo o jogo, como o botão de som da partida.
    </p>
  </Section>
);

/** Tela cheia de verdade do navegador, acompanhando o F11 e o botão da partida. */
export const useFullscreen = () => {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const update = () => setOn(!!document.fullscreenElement);
    update();
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);
  const toggle = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  };
  return [on, toggle] as const;
};

const VideoTab = ({ settings }: { settings: Settings }) => {
  const [fullscreen, toggleFullscreen] = useFullscreen();
  return (
    <>
      <Section title="TELA">
        <Toggle label="Tela cheia" hint="Ocupa o monitor inteiro (Esc sai)" checked={fullscreen} onChange={toggleFullscreen} />
      </Section>
      <Section title="IMAGEM">
        <Slider label="Brilho" value={settings.brightness} min={0.5} max={1.5} onChange={(brightness) => set({ brightness })} />
        <Slider label="Contraste" value={settings.contrast} min={0.5} max={1.5} onChange={(contrast) => set({ contrast })} />
        <p className="text-[11px] text-zinc-500">100% é a imagem original.</p>
      </Section>
    </>
  );
};

const GraphicsTab = ({ settings }: { settings: Settings }) => (
  <>
    <Section title="CORES">
      <Slider label="Saturação" value={settings.saturation} min={0} max={1.5} onChange={(saturation) => set({ saturation })} />
    </Section>
    <Section title="DESEMPENHO">
      <Toggle
        label="Desfoque da interface"
        hint="Fundo desfocado atrás dos painéis; desligar deixa o jogo mais leve"
        checked={settings.uiBlur}
        onChange={(uiBlur) => set({ uiBlur })}
      />
      <Toggle label="Mostrar FPS" hint="Quadros por segundo no canto da tela" checked={settings.showFps} onChange={(showFps) => set({ showFps })} />
    </Section>
  </>
);

const AccessibilityTab = ({ settings }: { settings: Settings }) => (
  <>
    <Section title="MODO DALTÔNICO">
      <div className="grid grid-cols-2 gap-2">
        {COLOR_MODES.map(({ mode, label, hint }) => {
          const selected = settings.colorMode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => set({ colorMode: mode })}
              className="rounded-lg border px-3 py-2 text-left transition-colors"
              style={{
                borderColor: selected ? ACCENT : "rgba(255,255,255,0.1)",
                background: selected ? "rgba(201,188,255,0.12)" : "rgba(0,0,0,0.3)",
              }}
            >
              <span className="block text-xs font-bold uppercase tracking-widest text-zinc-100">{label}</span>
              <span className="block text-[11px] text-zinc-400">{hint}</span>
            </button>
          );
        })}
      </div>
      <Slider
        label="Intensidade"
        value={settings.colorStrength}
        disabled={settings.colorMode === "off"}
        onChange={(colorStrength) => set({ colorStrength })}
      />
      <div className="flex flex-wrap gap-2">
        {SWATCHES.map(({ label, color }) => (
          <span
            key={label}
            className="flex items-center gap-2 rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[11px] font-bold uppercase tracking-widest text-zinc-200"
          >
            <span className="h-3 w-3 rounded-sm" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
            {label}
          </span>
        ))}
      </div>
    </Section>
    <Section title="CONFORTO VISUAL">
      <Toggle
        label="Tremor da tela"
        hint="Tremor e distorção na explosão da C4"
        checked={settings.screenShake}
        onChange={(screenShake) => set({ screenShake })}
      />
      <Toggle
        label="Flash suave"
        hint="Troca a tela branca da Flashbang por um véu mais fraco"
        checked={settings.softFlash}
        onChange={(softFlash) => set({ softFlash })}
      />
    </Section>
  </>
);

export const SettingsPanel = ({ onClose }: { onClose: () => void }) => {
  const settings = useSettings();
  const [tab, setTab] = useState<Tab>("audio");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Configurações"
        onClick={(e) => e.stopPropagation()}
        className="tactical-cut w-full max-w-xl p-[2px]"
        style={
          {
            "--cut": "22px",
            background: `linear-gradient(90deg, ${policePalette.rim}, ${ACCENT}, ${factionPalette.rim})`,
          } as CSSProperties
        }
      >
        <div
          className="tactical-cut flex h-[min(620px,85vh)] flex-col gap-5 p-6"
          style={{ "--cut": "21px", background: "radial-gradient(ellipse at 50% 0%, #17132a, #07060c 75%)" } as CSSProperties}
        >
          <header className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold tracking-[0.4em] text-zinc-400">CARD STRIKE</p>
              <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-white">Configurações</h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={20} />
            </button>
          </header>

          <nav role="tablist" className="grid grid-cols-4 gap-1 rounded-lg border border-white/10 bg-black/40 p-1">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className="rounded-md px-2 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors"
                style={tab === id ? { background: ACCENT, color: "#07060c" } : { color: "#a1a1aa" }}
              >
                {label}
              </button>
            ))}
          </nav>

          <div role="tabpanel" className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pr-1">
            {tab === "audio" && <AudioTab settings={settings} />}
            {tab === "video" && <VideoTab settings={settings} />}
            {tab === "graphics" && <GraphicsTab settings={settings} />}
            {tab === "access" && <AccessibilityTab settings={settings} />}
          </div>

          <footer className="flex items-center justify-between gap-3">
            <button
              onClick={resetSettings}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <RotateCcw size={14} />
              Restaurar padrão
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-white px-6 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-black transition-colors hover:bg-zinc-200"
            >
              Pronto
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
};

/** Botão de engrenagem que abre as configurações. */
export const SettingsButton = ({ className = "", label }: { className?: string; label?: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Configurações" title="Configurações" className={className}>
        <SettingsIcon size={label ? 14 : 16} />
        {label}
      </button>
      {/* No corpo da página: dentro de um elemento animado o painel ficaria preso atrás dele. */}
      {open && createPortal(<SettingsPanel onClose={() => setOpen(false)} />, document.body)}
    </>
  );
};
