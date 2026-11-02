"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Settings as SettingsIcon, X } from "lucide-react";
import { SettingsView } from "./settings-view";

export { useFullscreen } from "./use-fullscreen";

/* ═══════════════════════════════════════════════
   CONFIGURAÇÕES NA PARTIDA
   A mesma tela do menu (settings-view.tsx), em tela
   cheia por cima do jogo, com uma barra para fechar.
   ═══════════════════════════════════════════════ */

export const SettingsPanel = ({ onClose }: { onClose: () => void }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-label="Configurações"
      className="fixed inset-0 z-[120] flex flex-col bg-[#06050c]/95 font-mono text-white animate-in fade-in duration-200"
    >
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-black/45 px-4">
        <h2 className="text-lg font-light uppercase tracking-[0.25em]">
          Configurações
        </h2>
        <button
          onClick={onClose}
          className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          Voltar ao jogo <X size={18} />
        </button>
      </header>
      <div className="min-h-0 flex-1">
        <SettingsView />
      </div>
    </div>
  );
};

/** Botão de engrenagem que abre as configurações. */
export const SettingsButton = ({
  className = "",
  label,
}: {
  className?: string;
  label?: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Configurações"
        title="Configurações"
        className={className}
      >
        <SettingsIcon size={label ? 14 : 16} />
        {label}
      </button>
      {/* No corpo da página: dentro de um elemento animado o painel ficaria preso atrás dele. */}
      {open &&
        createPortal(
          <SettingsPanel onClose={() => setOpen(false)} />,
          document.body,
        )}
    </>
  );
};
