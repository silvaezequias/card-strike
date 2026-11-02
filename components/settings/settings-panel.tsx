"use client";

import { CSSProperties, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Settings as SettingsIcon, X } from "lucide-react";
import { factionPalette, policePalette } from "@/components/art/palette";
import {
  ACCENT,
  ResetButton,
  SettingsList,
  SettingsTab,
  SettingsTabs,
} from "./settings-view";

export { useFullscreen } from "./use-fullscreen";

/* ═══════════════════════════════════════════════
   CONFIGURAÇÕES NA PARTIDA
   Janela por cima do jogo com as mesmas abas e
   opções da tela do menu (settings-view.tsx).
   ═══════════════════════════════════════════════ */

export const SettingsPanel = ({ onClose }: { onClose: () => void }) => {
  const [tab, setTab] = useState<SettingsTab>("video");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Configurações"
        onClick={(e) => e.stopPropagation()}
        className="tactical-cut w-full max-w-2xl p-[2px]"
        style={
          {
            "--cut": "22px",
            background: `linear-gradient(90deg, ${policePalette.rim}, ${ACCENT}, ${factionPalette.rim})`,
          } as CSSProperties
        }
      >
        <div
          className="tactical-cut flex h-[min(640px,85vh)] flex-col gap-4 p-6 font-mono"
          style={
            {
              "--cut": "21px",
              background:
                "radial-gradient(ellipse at 50% 0%, #121a2e, #06070c 75%)",
            } as CSSProperties
          }
        >
          <header className="flex items-center justify-between">
            <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-white">
              Configurações
            </h2>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={20} />
            </button>
          </header>

          <SettingsTabs tab={tab} onTab={setTab} />

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <SettingsList tab={tab} />
          </div>

          <footer className="flex items-center justify-between gap-3">
            <ResetButton />
            <button
              onClick={onClose}
              className="rounded-sm bg-white px-6 py-2.5 text-xs font-bold uppercase tracking-[0.2em] text-black transition-colors hover:bg-zinc-200"
            >
              Pronto
            </button>
          </footer>
        </div>
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
