import { getSettings, subscribeSettings, updateSettings } from "./settings";

/* ═══════════════════════════════════════════════
   SONS DO JOGO
   Um único canal de áudio toca os efeitos curtos e
   os loops. Sem suporte ou sem permissão do navegador
   o jogo segue mudo, sem erro.
   ═══════════════════════════════════════════════ */

const SOUND_NAMES = [
  "pistol",
  "deagle",
  "sniper",
  "rifle",
  "grenade",
  "flashbang",
  "glass",
  "smoke-burst",
  "smoke-loop",
  "fire-loop",
  "c4-explosion",
  "bomb-beep",
  "bomb-plant",
  "bomb-defuse",
  "dice-hit",
  "dice-shake",
] as const;

export type SoundName = (typeof SOUND_NAMES)[number];

const LOOP_FADE_S = 0.25;

type Loop = { source: AudioBufferSourceNode; gain: GainNode };

let context: AudioContext | null = null;
let master: GainNode | null = null;
/** Efeitos sonoros (tiros, bomba, dado, loops); a música tem o seu. */
let effects: GainNode | null = null;
const buffers = new Map<SoundName, AudioBuffer>();
const loops = new Map<SoundName, Loop>();
/** Volume pedido antes de o som terminar de carregar. */
const wantedLoops = new Map<SoundName, number>();

const loadSound = async (audio: AudioContext, name: SoundName) => {
  try {
    const response = await fetch(`/audio/${name}.ogg`);
    buffers.set(name, await audio.decodeAudioData(await response.arrayBuffer()));
    const wanted = wantedLoops.get(name);
    if (wanted) setLoopVolume(name, wanted);
  } catch {
    // Sem esse som: o resto continua funcionando.
  }
};

/** Aplica os volumes das configurações (geral, efeitos e música). */
const applyVolumes = () => {
  if (!context || !master || !effects) return;
  const settings = getSettings();
  const now = context.currentTime;
  master.gain.setTargetAtTime(settings.muted ? 0 : settings.master, now, 0.03);
  effects.gain.setTargetAtTime(settings.effectsMuted ? 0 : settings.effects, now, 0.03);
  if (playingMode && musicGain) musicGain.gain.setTargetAtTime(musicVolume(playingMode), now, 0.03);
};

/** Prepara o áudio; pode ser chamado de novo para retomar após um clique. */
export const startAudio = () => {
  if (context) {
    context.resume().catch(() => {});
    return;
  }
  if (typeof AudioContext === "undefined") return;

  context = new AudioContext();
  master = context.createGain();
  effects = context.createGain();
  master.gain.value = 0;
  effects.connect(master);
  master.connect(context.destination);
  applyVolumes();
  subscribeSettings(applyVolumes);
  context.resume().catch(() => {});
  SOUND_NAMES.forEach((name) => loadSound(context!, name));
};

export const isMuted = () => getSettings().muted;

export const setMuted = (value: boolean) => updateSettings({ muted: value });

export const playSound = (
  name: SoundName,
  { volume = 1, delay = 0, rate = 1 }: { volume?: number; delay?: number; rate?: number } = {},
) => {
  const buffer = buffers.get(name);
  if (!context || !effects || !buffer) return;

  const source = context.createBufferSource();
  const gain = context.createGain();
  source.buffer = buffer;
  source.playbackRate.value = rate;
  gain.gain.value = volume;
  source.connect(gain).connect(effects);
  source.start(context.currentTime + delay);
};

/** Liga, ajusta ou (volume 0) desliga um som contínuo, sem estalo. */
export function setLoopVolume(name: SoundName, volume: number) {
  wantedLoops.set(name, volume);
  const buffer = buffers.get(name);
  if (!context || !effects || !buffer) return;

  let loop = loops.get(name);
  if (!loop && volume <= 0) return;

  if (!loop) {
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    source.loop = true;
    gain.gain.value = 0;
    source.connect(gain).connect(effects);
    source.start();
    loop = { source, gain };
    loops.set(name, loop);
  }

  const { currentTime } = context;
  loop.gain.gain.cancelScheduledValues(currentTime);
  loop.gain.gain.setTargetAtTime(volume, currentTime, LOOP_FADE_S / 3);

  if (volume <= 0) {
    loop.source.stop(currentTime + LOOP_FADE_S * 2);
    loops.delete(name);
  }
}

/* ───────── Música de fundo ───────── */

/**
 * Menu: as faixas calmas. Partida: as de guerra. Bomba plantada: a mesma
 * faixa de guerra acelerada (arquivo "-fast"), retomada no ponto equivalente.
 */
export type MusicMode = "menu" | "game" | "bomb";

const PLAYLISTS: Record<MusicMode, string[]> = {
  menu: ["/audio/menu-1.ogg", "/audio/menu-2.ogg"],
  game: ["/audio/war-1.ogg", "/audio/war-2.ogg"],
  bomb: ["/audio/war-1-fast.ogg", "/audio/war-2-fast.ogg"],
};
/** Velocidade das versões "-fast" (as faixas de guerra têm o mesmo índice). */
const FAST_RATE = 1.25;
/** Bem abaixo dos efeitos, para não brigar com tiros e narração. */
const MUSIC_VOLUME: Record<MusicMode, number> = { menu: 0.22, game: 0.24, bomb: 0.28 };
const MUSIC_FADE_S = 0.7;

/** Volume da música do momento, já com o ajuste do jogador (menu ou partida). */
const musicVolume = (mode: MusicMode) => {
  const settings = getSettings();
  const [volume, muted] =
    mode === "menu" ? [settings.menuMusic, settings.menuMusicMuted] : [settings.gameMusic, settings.gameMusicMuted];
  return muted ? 0 : MUSIC_VOLUME[mode] * volume;
};

let music: HTMLAudioElement | null = null;
let musicGain: GainNode | null = null;
let wantedMode: MusicMode | null = null;
let playingMode: MusicMode | null = null;
let musicTrack = 0;
let switchToken = 0;

const fadeMusic = (volume: number) => {
  if (!context || !musicGain) return;
  const now = context.currentTime;
  musicGain.gain.cancelScheduledValues(now);
  musicGain.gain.setValueAtTime(musicGain.gain.value, now);
  musicGain.gain.linearRampToValueAtTime(volume, now + MUSIC_FADE_S);
};

const ensureMusic = () => {
  if (music || !context || !master) return music;
  music = new Audio();
  musicGain = context.createGain();
  musicGain.gain.value = 0;
  // Passa pelo master: o botão de som também cala a música.
  context.createMediaElementSource(music).connect(musicGain).connect(master);
  music.addEventListener("ended", () => {
    if (!playingMode) return;
    const list = PLAYLISTS[playingMode];
    musicTrack = (musicTrack + 1) % list.length;
    music!.src = list[musicTrack];
    music!.play().catch(() => {});
  });
  return music;
};

/** Toca a lista do momento; chamada de novo após um clique se o navegador bloqueou. */
export const resumeMusic = () => {
  const el = ensureMusic();
  if (!el || !context) return;

  if (wantedMode === playingMode) {
    if (wantedMode && el.paused) el.play().catch(() => {});
    return;
  }

  const from = playingMode;
  const to = wantedMode;
  const token = ++switchToken;
  playingMode = to;
  fadeMusic(0);

  window.setTimeout(
    () => {
      if (token !== switchToken) return;
      if (!to) {
        el.pause();
        return;
      }
      // Partida ↔ bomba: mesma faixa, no ponto equivalente da outra velocidade.
      const sameSong = (from === "game" && to === "bomb") || (from === "bomb" && to === "game");
      const at = sameSong ? (to === "bomb" ? el.currentTime / FAST_RATE : el.currentTime * FAST_RATE) : 0;
      if (!sameSong) musicTrack = Math.floor(Math.random() * PLAYLISTS[to].length);
      el.src = PLAYLISTS[to][musicTrack];
      el.addEventListener("loadedmetadata", () => (el.currentTime = Math.min(at, el.duration - 1)), { once: true });
      el.play().catch(() => {});
      fadeMusic(musicVolume(to));
    },
    from && !el.paused ? MUSIC_FADE_S * 1000 : 0,
  );
};

/** Escolhe a música do momento (null para silêncio). */
export const setMusic = (mode: MusicMode | null) => {
  wantedMode = mode;
  resumeMusic();
};
