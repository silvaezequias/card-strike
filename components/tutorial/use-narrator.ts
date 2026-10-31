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

export const useNarrator = () => {
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const tokenRef = useRef(0);

  const stop = useCallback(() => {
    tokenRef.current++;
    audioRef.current?.pause();
    audioRef.current = null;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

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
    [muted, stop],
  );

  // As vozes do navegador carregam depois; pedir a lista já dispara o carregamento.
  useEffect(() => {
    window.speechSynthesis?.getVoices();
    return stop;
  }, [stop]);

  return { speak, stop, speaking, muted, setMuted };
};
