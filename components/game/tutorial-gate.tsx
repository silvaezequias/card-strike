"use client";

import { createContext, ReactNode, useContext } from "react";

/* ═══════════════════════════════════════════════
   TRAVA DO TUTORIAL
   No tutorial só as opções liberadas pelo passo atual
   respondem, e uma delas pode ficar em destaque. Fora
   do tutorial (sem provider) tudo fica liberado.
   ═══════════════════════════════════════════════ */

export type GateKey =
  | "choose.d6" // botão "Posicionar carta"
  | "choose.spinner" // botão "Se posicionar"
  | "roll" // rolar dado / girar roleta
  | "back" // voltar para as ações
  | "buy" // comprar carta (baralho ou "+" da mão)
  | "place" // posicionar carta da mão no slot
  | "play" // jogar a carta do slot sorteado
  | "keep" // manter cartas na mão
  | "tabs" // minimizar e reabrir o painel de ação
  | "camera" // botões de câmera do topo
  | "inventory"; // abrir/fechar o inventário

export type GateState = { allowed: GateKey[]; highlight: GateKey | null };

const GateContext = createContext<GateState | null>(null);

export const TutorialGateProvider = ({ value, children }: { value: GateState | null; children: ReactNode }) => (
  <GateContext.Provider value={value}>{children}</GateContext.Provider>
);

/** Classe do contorno animado que chama atenção para a opção. */
export const HIGHLIGHT_CLASS = "tutorial-highlight";

export const useGate = (key: GateKey) => {
  const gate = useContext(GateContext);
  if (!gate) return { allowed: true, highlighted: false };
  return { allowed: gate.allowed.includes(key), highlighted: gate.highlight === key };
};
