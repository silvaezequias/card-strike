"use client";

import { useEffect, useState } from "react";

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
