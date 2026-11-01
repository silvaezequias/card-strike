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
