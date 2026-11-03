"use client";

import {
  CSSProperties,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { factionPalette, policePalette } from "@/components/art/palette";
import {
  CharacterImage,
  TEAM_CHARACTERS,
  characterCrop,
} from "@/components/art/characters";
import { NoirCard } from "@/components/art/noir-card";
import { generateRandomCard } from "@/lib/game-helpers";
import {
  ColorMode,
  Settings,
  resetSettings,
  updateSettings,
  useSettings,
} from "@/lib/settings";
import { useFullscreen } from "./use-fullscreen";

/* ═══════════════════════════════════════════════
   CONFIGURAÇÕES (conteúdo)
   No estilo das telas de opções dos jogos táticos:
   subabas no topo, a pré-visualização ao vivo à
   esquerda e a lista de opções à direita, cada uma
   com o valor e a setinha de escolha. Na partida
   aparece numa janela, sem a pré-visualização.
   ═══════════════════════════════════════════════ */

export const ACCENT = "#86e3ff";

export type SettingsTab = "video" | "audio" | "graphics" | "access";

export const SETTINGS_TABS: { id: SettingsTab; label: string }[] = [
  { id: "video", label: "Vídeo" },
  { id: "audio", label: "Áudio" },
  { id: "graphics", label: "Gráficos" },
  { id: "access", label: "Acessibilidade" },
];

const COLOR_MODES: { value: ColorMode; label: string }[] = [
  { value: "off", label: "Desligado" },
  { value: "protanopia", label: "Protanopia" },
  { value: "deuteranopia", label: "Deuteranopia" },
  { value: "tritanopia", label: "Tritanopia" },
];

const ON_OFF = [
  { value: true, label: "Ligado" },
  { value: false, label: "Desligado" },
];

/** Cores que o jogo precisa separar: mostram o efeito do modo daltônico na hora. */
const SWATCHES = [
  { label: "Militar", color: policePalette.rim },
  { label: "Terrorista", color: factionPalette.rim },
  { label: "Vida", color: "#5cffa8" },
  { label: "Dano", color: "#ff5c70" },
  { label: "Conflito", color: "#ffb020" },
];

const VOLUMES: {
  label: string;
  value: keyof Settings;
  muted: keyof Settings;
}[] = [
  { label: "Volume geral", value: "master", muted: "muted" },
  { label: "Efeitos sonoros", value: "effects", muted: "effectsMuted" },
  { label: "Música do menu", value: "menuMusic", muted: "menuMusicMuted" },
  { label: "Música da partida", value: "gameMusic", muted: "gameMusicMuted" },
  { label: "Narração (tutorial)", value: "narration", muted: "narrationMuted" },
];

const set = (changes: Partial<Settings>) => updateSettings(changes);

/* ───────── Linhas ───────── */

const GroupTitle = ({ children }: { children: ReactNode }) => (
  <h3 className="border-b border-white/10 pb-2 pt-4 text-sm font-bold text-zinc-500 first:pt-0">
    {children}
  </h3>
);

const Row = ({
  label,
  hint,
  indent,
  children,
}: {
  label: string;
  hint?: string;
  indent?: boolean;
  children: ReactNode;
}) => (
  <div
    className={`flex min-h-[52px] items-center gap-4 border-b border-white/10 py-2 ${indent ? "pl-8" : ""}`}
  >
    <div className="min-w-0 flex-1">
      <p className="text-[15px] text-zinc-200">{label}</p>
      {hint && <p className="text-[11px] text-zinc-500">{hint}</p>}
    </div>
    <div className="flex shrink-0 items-center justify-end">{children}</div>
  </div>
);

/** Valor com a setinha: abre a lista de opções. */
const Choice = <T extends string | boolean>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) =>
      !ref.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);
  const current = options.find((o) => o.value === value)?.label ?? "";
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 px-1 py-1 text-base font-black uppercase tracking-wide text-white transition-colors hover:text-[#86e3ff]"
      >
        {current}
        <ChevronDown
          size={18}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-30 mt-1 min-w-[180px] overflow-hidden rounded-sm border border-white/15 bg-[#0b0f1c] shadow-2xl"
        >
          {options.map((o) => (
            <li key={String(o.value)}>
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-bold uppercase tracking-wide text-zinc-300 hover:bg-white/10 hover:text-white"
              >
                {o.label}
                {o.value === value && (
                  <Check size={14} style={{ color: ACCENT }} />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/** Barra de 0 a 100% com o número ao lado. */
const Slider = ({
  value,
  min = 0,
  max = 1,
  disabled,
  onChange,
  label,
}: {
  value: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  label: string;
}) => {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className={`flex items-center gap-3 ${disabled ? "opacity-40" : ""}`}>
      <input
        type="range"
        aria-label={label}
        min={Math.round(min * 100)}
        max={Math.round(max * 100)}
        step={5}
        value={Math.round(value * 100)}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="settings-range h-1.5 w-40 cursor-pointer sm:w-52"
        style={{ "--fill": `${fill}%` } as CSSProperties}
      />
      <span className="w-12 rounded-sm border border-white/15 bg-black/40 py-0.5 text-center font-mono text-xs text-zinc-200">
        {Math.round(value * 100)}
      </span>
    </div>
  );
};

const MuteButton = ({
  label,
  muted,
  onToggle,
}: {
  label: string;
  muted: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    onClick={onToggle}
    aria-pressed={muted}
    aria-label={muted ? `Ligar ${label}` : `Mutar ${label}`}
    title={muted ? "Ligar" : "Mutar"}
    className="mr-3 flex h-8 w-8 items-center justify-center rounded-sm border transition-colors"
    style={{
      borderColor: muted ? "#ef4444" : "rgba(255,255,255,0.15)",
      color: muted ? "#fca5a5" : "#e4e4e7",
      background: muted ? "rgba(239,68,68,0.15)" : "rgba(0,0,0,0.3)",
    }}
  >
    {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
  </button>
);

/* ───────── Abas ───────── */

const VideoTab = ({ settings }: { settings: Settings }) => {
  const [fullscreen, toggleFullscreen] = useFullscreen();
  return (
    <>
      <GroupTitle>Tela</GroupTitle>
      <Row label="Modo de exibição">
        <Choice
          value={fullscreen}
          options={[
            { value: true, label: "Tela cheia" },
            { value: false, label: "Janela" },
          ]}
          onChange={(on) => on !== fullscreen && toggleFullscreen()}
        />
      </Row>
      <GroupTitle>Imagem</GroupTitle>
      <Row label="Brilho" hint="100 é a imagem original">
        <Slider
          label="Brilho"
          value={settings.brightness}
          min={0.5}
          max={1.5}
          onChange={(brightness) => set({ brightness })}
        />
      </Row>
      <Row label="Contraste">
        <Slider
          label="Contraste"
          value={settings.contrast}
          min={0.5}
          max={1.5}
          onChange={(contrast) => set({ contrast })}
        />
      </Row>
    </>
  );
};

const AudioTab = ({ settings }: { settings: Settings }) => (
  <>
    <GroupTitle>Volumes</GroupTitle>
    {VOLUMES.map(({ label, value, muted }, i) => {
      const isMuted = settings[muted] as boolean;
      // Geral mutado cala tudo: os outros ficam apagados.
      const silencedByMaster = muted !== "muted" && settings.muted;
      return (
        <Row key={value} label={label} indent={i > 0}>
          <MuteButton
            label={label}
            muted={isMuted}
            onToggle={() => set({ [muted]: !isMuted })}
          />
          <Slider
            label={label}
            value={settings[value] as number}
            disabled={isMuted || silencedByMaster}
            onChange={(v) => set({ [value]: v })}
          />
        </Row>
      );
    })}
    <p className="pt-3 text-[11px] text-zinc-500">
      O volume geral multiplica os outros. Mutar o geral cala todo o jogo.
    </p>
  </>
);

const GraphicsTab = ({ settings }: { settings: Settings }) => (
  <>
    <GroupTitle>Cores</GroupTitle>
    <Row label="Saturação">
      <Slider
        label="Saturação"
        value={settings.saturation}
        min={0}
        max={1.5}
        onChange={(saturation) => set({ saturation })}
      />
    </Row>
    <GroupTitle>Desempenho</GroupTitle>
    <Row label="Desfoque da interface" hint="Desligar deixa o jogo mais leve">
      <Choice
        value={settings.uiBlur}
        options={ON_OFF}
        onChange={(uiBlur) => set({ uiBlur })}
      />
    </Row>
    <Row label="Mostrar FPS" hint="Quadros por segundo no canto da tela">
      <Choice
        value={settings.showFps}
        options={ON_OFF}
        onChange={(showFps) => set({ showFps })}
      />
    </Row>
  </>
);

const AccessibilityTab = ({ settings }: { settings: Settings }) => (
  <>
    <GroupTitle>Cores</GroupTitle>
    <Row label="Modo daltônico">
      <Choice
        value={settings.colorMode}
        options={COLOR_MODES}
        onChange={(colorMode) => set({ colorMode })}
      />
    </Row>
    <Row label="Intensidade da correção" indent>
      <Slider
        label="Intensidade da correção"
        value={settings.colorStrength}
        disabled={settings.colorMode === "off"}
        onChange={(colorStrength) => set({ colorStrength })}
      />
    </Row>
    <GroupTitle>Conforto visual</GroupTitle>
    <Row label="Tremor da tela" hint="Tremor e distorção na explosão da C4">
      <Choice
        value={settings.screenShake}
        options={ON_OFF}
        onChange={(screenShake) => set({ screenShake })}
      />
    </Row>
    <Row
      label="Flash suave"
      hint="Véu mais fraco no lugar da tela branca da Flashbang"
    >
      <Choice
        value={settings.softFlash}
        options={ON_OFF}
        onChange={(softFlash) => set({ softFlash })}
      />
    </Row>
  </>
);

/* ───────── Pré-visualização ───────── */

const Operator = ({ team }: { team: "police" | "faction" }) => {
  const art = TEAM_CHARACTERS[team][0];
  const box = characterCrop(art, "full");
  return (
    <svg
      viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
      className="h-full w-auto drop-shadow-[0_20px_30px_rgba(0,0,0,0.7)]"
      aria-hidden="true"
    >
      <CharacterImage art={art} />
    </svg>
  );
};

/** Cena do jogo com as configurações aplicadas na hora, e um detalhe ampliado embaixo. */
const Preview = () => {
  const card = useMemo(() => generateRandomCard("police"), []);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className="relative flex min-h-0 flex-[3] items-end justify-center gap-6 overflow-hidden border-b border-white/10"
        style={{
          background: `radial-gradient(ellipse at 25% 60%, ${policePalette.bg2}, transparent 60%), radial-gradient(ellipse at 75% 60%, ${factionPalette.bg2}, transparent 60%), #06050c`,
        }}
      >
        <div className="h-[88%]">
          <Operator team="police" />
        </div>
        <div className="absolute bottom-6 left-1/2 w-24 -translate-x-1/2 rotate-[-6deg]">
          <NoirCard
            card={card}
            team="police"
            className="block h-auto w-full drop-shadow-[0_10px_14px_rgba(0,0,0,0.8)]"
          />
        </div>
        <div className="h-[88%]">
          <Operator team="faction" />
        </div>
        <span className="absolute left-3 top-2 text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">
          Pré-visualização
        </span>
      </div>

      <div className="flex min-h-0 flex-[2] flex-col gap-3 bg-black/40 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400">
          Cores do jogo
        </p>
        <div className="grid grid-cols-5 gap-2">
          {SWATCHES.map(({ label, color }) => (
            <span key={label} className="flex flex-col items-center gap-1.5">
              <span
                className="h-10 w-full rounded-sm"
                style={{
                  background: color,
                  boxShadow: `0 0 14px ${color}88`,
                }}
              />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                {label}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ───────── Tela ───────── */

export const SettingsTabs = ({
  tab,
  onTab,
}: {
  tab: SettingsTab;
  onTab: (tab: SettingsTab) => void;
}) => (
  <nav role="tablist" className="flex items-center justify-center gap-1">
    {SETTINGS_TABS.map(({ id, label }) => (
      <button
        key={id}
        type="button"
        role="tab"
        aria-selected={tab === id}
        onClick={() => onTab(id)}
        className="rounded-sm px-3 py-1 text-xs font-bold uppercase tracking-widest transition-colors"
        style={
          tab === id
            ? { background: `${ACCENT}26`, color: ACCENT }
            : { color: "#e4e4e7" }
        }
      >
        {label}
      </button>
    ))}
  </nav>
);

export const SettingsList = ({ tab }: { tab: SettingsTab }) => {
  const settings = useSettings();
  return (
    <div role="tabpanel" className="flex flex-col">
      {tab === "video" && <VideoTab settings={settings} />}
      {tab === "audio" && <AudioTab settings={settings} />}
      {tab === "graphics" && <GraphicsTab settings={settings} />}
      {tab === "access" && <AccessibilityTab settings={settings} />}
    </div>
  );
};

export const ResetButton = () => (
  <button
    type="button"
    onClick={resetSettings}
    className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-zinc-200 transition-colors hover:text-white"
  >
    <RotateCcw size={18} /> Restaurar padrão
  </button>
);

/** Tela inteira de configurações (aba do menu principal). */
export const SettingsView = () => {
  const [tab, setTab] = useState<SettingsTab>("video");
  return (
    <div className="flex h-full flex-col bg-black/45 backdrop-blur-sm">
      <div className="border-b border-white/10 bg-black/40 py-2">
        <SettingsTabs tab={tab} onTab={setTab} />
      </div>
      <div className="flex min-h-0 flex-1">
        {/* Pré-visualização só em Acessibilidade: mostra o efeito do modo daltônico. */}
        {tab === "access" && (
          <div className="hidden min-h-0 w-[45%] border-r border-white/10 md:block">
            <Preview />
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col">
          <div
            className={`min-h-0 flex-1 overflow-y-auto px-6 py-4 lg:px-10 ${tab === "access" ? "" : "mx-auto w-full max-w-4xl"}`}
          >
            <h2 className="mb-1 text-lg font-bold text-zinc-400">
              {SETTINGS_TABS.find((t) => t.id === tab)?.label}
            </h2>
            <SettingsList tab={tab} />
          </div>
          <footer className="flex items-center justify-end gap-6 border-t border-white/10 px-6 py-3">
            <span className="text-xs text-zinc-500">
              As mudanças valem na hora e ficam salvas neste navegador.
            </span>
            <ResetButton />
          </footer>
        </div>
      </div>
    </div>
  );
};
