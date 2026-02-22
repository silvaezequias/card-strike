"use client";

import { Skull } from "lucide-react";

export const GameOverOverlay = ({
  visible,
  message,
  subMessage,
  onRetry,
}: {
  visible: boolean;
  message: string;
  subMessage: string;
  onRetry: () => void;
}) => {
  if (!visible) return null;
  return (
    <div className="absolute inset-0 z-[100] bg-black/80 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-1000">
      <div className="text-center">
        <Skull size={100} className="text-red-600 mx-auto mb-4 animate-pulse" />
        <h1 className="text-6xl font-black text-red-600 tracking-widest drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]">
          {message}
        </h1>
        <p className="text-zinc-400 mt-4 text-xl tracking-widest">
          {subMessage}
        </p>
        <button
          onClick={onRetry}
          className="mt-8 px-8 py-3 bg-red-800 hover:bg-red-700 text-white rounded border border-red-500 font-bold tracking-widest"
        >
          TENTAR NOVAMENTE
        </button>
      </div>
    </div>
  );
};
