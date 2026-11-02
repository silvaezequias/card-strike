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

const MUTE_KEY = "card-strike:muted";
const LOOP_FADE_S = 0.25;

type Loop = { source: AudioBufferSourceNode; gain: GainNode };

let context: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;
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

const readMuted = () => {
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
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
  muted = readMuted();
  master.gain.value = muted ? 0 : 1;
  master.connect(context.destination);
  context.resume().catch(() => {});
  SOUND_NAMES.forEach((name) => loadSound(context!, name));
};

export const isMuted = () => muted;

export const setMuted = (value: boolean) => {
  muted = value;
  if (master) master.gain.value = value ? 0 : 1;
  try {
    window.localStorage.setItem(MUTE_KEY, value ? "1" : "0");
  } catch {
    // Só não fica salvo.
  }
};

export const playSound = (
  name: SoundName,
  { volume = 1, delay = 0, rate = 1 }: { volume?: number; delay?: number; rate?: number } = {},
) => {
  const buffer = buffers.get(name);
  if (!context || !master || !buffer) return;

  const source = context.createBufferSource();
  const gain = context.createGain();
  source.buffer = buffer;
  source.playbackRate.value = rate;
  gain.gain.value = volume;
  source.connect(gain).connect(master);
  source.start(context.currentTime + delay);
};

/** Liga, ajusta ou (volume 0) desliga um som contínuo, sem estalo. */
export function setLoopVolume(name: SoundName, volume: number) {
  wantedLoops.set(name, volume);
  const buffer = buffers.get(name);
  if (!context || !master || !buffer) return;

  let loop = loops.get(name);
  if (!loop && volume <= 0) return;

  if (!loop) {
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    source.loop = true;
    gain.gain.value = 0;
    source.connect(gain).connect(master);
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

/** Trilhas tocadas em sequência, uma depois da outra. */
const MUSIC_TRACKS = ["/audio/music-1.ogg", "/audio/music-2.ogg"];
/** Bem abaixo dos efeitos, para não brigar com tiros e narração. */
const MUSIC_VOLUME = 0.22;

let music: HTMLAudioElement | null = null;
let musicTrack = 0;
let musicWanted = false;

/** Liga a música (precisa de startAudio antes); pode ser chamada de novo após um clique. */
export const startMusic = () => {
  musicWanted = true;
  if (!context || !master) return;
  if (!music) {
    musicTrack = Math.floor(Math.random() * MUSIC_TRACKS.length);
    music = new Audio(MUSIC_TRACKS[musicTrack]);
    const gain = context.createGain();
    gain.gain.value = MUSIC_VOLUME;
    // Passa pelo master: o botão de som também cala a música.
    context.createMediaElementSource(music).connect(gain).connect(master);
    music.addEventListener("ended", () => {
      musicTrack = (musicTrack + 1) % MUSIC_TRACKS.length;
      music!.src = MUSIC_TRACKS[musicTrack];
      if (musicWanted) music!.play().catch(() => {});
    });
  }
  // Sem permissão do navegador ainda: tenta de novo no próximo clique.
  if (music.paused) music.play().catch(() => {});
};

export const stopMusic = () => {
  musicWanted = false;
  music?.pause();
};
