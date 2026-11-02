import { useSyncExternalStore } from "react";

/* ═══════════════════════════════════════════════
   CONFIGURAÇÕES DO JOGADOR
   Guardadas no navegador. Volumes vão de 0 a 1 e
   multiplicam o volume geral; "muted" cala tudo.
   ═══════════════════════════════════════════════ */

export type ColorMode = "off" | "protanopia" | "deuteranopia" | "tritanopia";

export type Settings = {
  /** Mudo do volume geral (o botão de som da partida também usa). */
  muted: boolean;
  master: number;
  effects: number;
  effectsMuted: boolean;
  menuMusic: number;
  menuMusicMuted: boolean;
  gameMusic: number;
  gameMusicMuted: boolean;
  narration: number;
  narrationMuted: boolean;
  /** Ajustes de imagem da tela inteira (1 = original). */
  brightness: number;
  contrast: number;
  saturation: number;
  /** Desfoque atrás dos painéis da interface. */
  uiBlur: boolean;
  showFps: boolean;
  colorMode: ColorMode;
  /** Força da correção de cor (0 a 1). */
  colorStrength: number;
  /** Tremor e distorção da tela na explosão da C4. */
  screenShake: boolean;
  /** Tela branca da Flashbang mais fraca (sensibilidade à luz). */
  softFlash: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  muted: false,
  master: 1,
  effects: 1,
  effectsMuted: false,
  menuMusic: 1,
  menuMusicMuted: false,
  gameMusic: 1,
  gameMusicMuted: false,
  narration: 1,
  narrationMuted: false,
  brightness: 1,
  contrast: 1,
  saturation: 1,
  uiBlur: true,
  showFps: false,
  colorMode: "off",
  colorStrength: 1,
  screenShake: true,
  softFlash: false,
};

const KEY = "card-strike:settings";
/** Chave antiga do botão de mudo, de antes desta tela. */
const LEGACY_MUTE_KEY = "card-strike:muted";

let current: Settings = DEFAULT_SETTINGS;
let loaded = false;
const listeners = new Set<() => void>();

const load = () => {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const saved = window.localStorage.getItem(KEY);
    if (saved) current = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    else if (window.localStorage.getItem(LEGACY_MUTE_KEY) === "1") current = { ...DEFAULT_SETTINGS, muted: true };
  } catch {
    // Sem acesso ao armazenamento: fica no padrão.
  }
};

export const getSettings = () => {
  load();
  return current;
};

export const updateSettings = (changes: Partial<Settings>) => {
  load();
  current = { ...current, ...changes };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // Só não fica salvo.
  }
  listeners.forEach((listener) => listener());
};

/** Volume final da narração do tutorial. */
export const narrationVolume = () => {
  const settings = getSettings();
  return settings.muted || settings.narrationMuted ? 0 : settings.master * settings.narration;
};

export const resetSettings = () => updateSettings(DEFAULT_SETTINGS);

export const subscribeSettings = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Configurações atuais; a tela atualiza quando alguma muda. */
export const useSettings = () =>
  useSyncExternalStore(subscribeSettings, getSettings, () => DEFAULT_SETTINGS);
