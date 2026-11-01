"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ═══════════════════════════════════════════════
   NARRADOR
   Toca o áudio enviado para o passo; sem áudio, usa a
   voz do navegador em português, um pouco mais rápida
   e aguda para soar animada.
   ═══════════════════════════════════════════════ */

const pickVoice = () => {
  const voices = window.speechSynthesis?.getVoices() ?? [];
  const pt = voices.filter((v) => v.lang.toLowerCase().startsWith("pt"));
  return (
    pt.find((v) => v.lang.toLowerCase() === "pt-br" && /francisca|maria|luciana|google/i.test(v.name)) ??
    pt.find((v) => v.lang.toLowerCase() === "pt-br") ??
    pt[0] ??
    null
  );
};

/* Cada <audio> abre um canal novo e a saída (Windows, Bluetooth) leva um
   instante para subir, o que engolia a primeira palavra. Por isso a narração
   usa um único canal, mantido aberto por um sinal inaudível do início ao fim. */
const FIRST_CLIP_LEAD_S = 0.35;
const NEXT_CLIP_LEAD_S = 0.05;
const KEEP_ALIVE_HZ = 20;
const KEEP_ALIVE_GAIN = 0.001;
const RESUME_TIMEOUT_MS = 800;

const openAudioOutput = () => {
  const context = new AudioContext();
  const signal = context.createOscillator();
  const gain = context.createGain();
  signal.frequency.value = KEEP_ALIVE_HZ;
  gain.gain.value = KEEP_ALIVE_GAIN;
  signal.connect(gain).connect(context.destination);
  signal.start();
  return context;
};

const resumeAudio = (context: AudioContext) =>
  Promise.race([
    context.resume(),
    new Promise((resolve) => window.setTimeout(resolve, RESUME_TIMEOUT_MS)),
  ]);

export const useNarrator = () => {
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const clipsRef = useRef(new Map<string, AudioBuffer>());
  const timerRef = useRef<number | null>(null);
  const tokenRef = useRef(0);

  const stop = useCallback(() => {
    tokenRef.current++;
    audioRef.current?.pause();
    audioRef.current = null;
    if (sourceRef.current) {
      sourceRef.current.onended = null;
      sourceRef.current.stop();
      sourceRef.current = null;
    }
    if (timerRef.current) window.clearTimeout(timerRef.current);
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  /** Reserva: toca num <audio> próprio se o canal único não estiver disponível. */
  const playOnElement = useCallback((audioUrl: string, finish: () => void) => {
    const el = new Audio(audioUrl);
    audioRef.current = el;
    el.onended = finish;
    el.onerror = finish;
    // Segurança caso o navegador não avise o fim (ex.: aba em segundo plano).
    el.onloadedmetadata = () => {
      if (Number.isFinite(el.duration)) {
        timerRef.current = window.setTimeout(finish, el.duration * 1000 + 1500);
      }
    };
    el.play().catch(finish);
  }, []);

  const playOnOutput = useCallback(
    async (audioUrl: string, token: number, finish: () => void) => {
      const firstClip = !contextRef.current;
      const context = (contextRef.current ??= openAudioOutput());
      await resumeAudio(context);
      if (context.state !== "running") throw new Error("Saída de áudio suspensa");

      let clip = clipsRef.current.get(audioUrl);
      if (!clip) {
        const response = await fetch(audioUrl);
        clip = await context.decodeAudioData(await response.arrayBuffer());
        clipsRef.current.set(audioUrl, clip);
      }
      if (tokenRef.current !== token) return;

      const source = context.createBufferSource();
      source.buffer = clip;
      source.connect(context.destination);
      source.onended = finish;
      sourceRef.current = source;
      source.start(context.currentTime + (firstClip ? FIRST_CLIP_LEAD_S : NEXT_CLIP_LEAD_S));
      // Segurança caso o navegador não avise o fim (ex.: aba em segundo plano).
      timerRef.current = window.setTimeout(finish, clip.duration * 1000 + 1500);
    },
    [],
  );

  /** Fala o texto (ou toca o áudio do projeto) e avisa quando terminar. */
  const speak = useCallback(
    (text: string, audioUrl?: string | null) => {
      stop();
      const token = tokenRef.current;
      const finish = () => {
        if (tokenRef.current === token) setSpeaking(false);
      };
      setSpeaking(true);

      // Mudo: dá um tempo de leitura proporcional ao texto.
      if (muted) {
        timerRef.current = window.setTimeout(finish, Math.min(6000, 900 + text.length * 35));
        return;
      }

      if (audioUrl) {
        playOnOutput(audioUrl, token, finish).catch(() => {
          if (tokenRef.current === token) playOnElement(audioUrl, finish);
        });
        return;
      }

      const synth = window.speechSynthesis;
      if (!synth) {
        timerRef.current = window.setTimeout(finish, 900 + text.length * 45);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pt-BR";
      utterance.voice = pickVoice();
      utterance.rate = 1.08;
      utterance.pitch = 1.15;
      utterance.onend = finish;
      utterance.onerror = finish;
      synth.speak(utterance);
      // O Chrome às vezes não dispara onend (textos longos, aba oculta).
      timerRef.current = window.setTimeout(finish, 2000 + text.length * 90);
    },
    [muted, stop, playOnElement, playOnOutput],
  );

  // As vozes do navegador carregam depois; pedir a lista já dispara o carregamento.
  useEffect(() => {
    window.speechSynthesis?.getVoices();
    return () => {
      stop();
      contextRef.current?.close();
      contextRef.current = null;
    };
  }, [stop]);

  return { speak, stop, speaking, muted, setMuted };
};
