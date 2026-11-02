"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DoorOpen, Loader2, WifiOff } from "lucide-react";
import { GameScreen, BOT_TURN_GATE } from "@/components/game/sci-fi-interface";
import { TutorialGateProvider } from "@/components/game/tutorial-gate";
import { useOnline } from "@/lib/online/online-context";
import { ABANDON_MS, AWAY_WARNING_MS, useOnlineEngine } from "@/lib/online/use-online-engine";

/* ═══════════════════════════════════════════════
   PARTIDA ONLINE
   A mesma tela do jogo, com o motor do servidor.
   Extras: aviso de oponente desconectado (W.O. em
   60 s), botão de sair (o outro vence) e o fim por
   W.O. na tela de vitória/derrota.
   ═══════════════════════════════════════════════ */

/** Motivo do W.O. para quem ganhou e para quem perdeu. */
const END_REASON: Record<string, [won: string, lost: string]> = {
  abandon: ["OPONENTE DESCONECTOU · VITÓRIA POR W.O.", "VOCÊ FICOU FORA POR MAIS DE 60 S · W.O."],
  left: ["O OPONENTE SAIU DA PARTIDA · VITÓRIA POR W.O.", "VOCÊ SAIU DA PARTIDA · W.O."],
};

export default function OnlineMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { setInMatch, setRoom } = useOnline();
  const online = useOnlineEngine(id);
  const [confirmLeave, setConfirmLeave] = useState(false);

  useEffect(() => {
    setInMatch(true);
    setRoom(null);
    return () => setInMatch(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!online.ready) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-[#050409] font-mono text-white">
        {online.error ? (
          <>
            <p className="text-sm text-red-300">{online.error}</p>
            <button className="rounded-md border border-white/20 px-4 py-2 text-xs uppercase tracking-widest" onClick={() => router.push("/")}>
              Voltar ao menu
            </button>
          </>
        ) : (
          <>
            <Loader2 className="animate-spin" />
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Conectando à partida</p>
          </>
        )}
      </div>
    );
  }

  const { engine, match, opponentAwayMs, myTurn, leave, opponent } = online;
  const finished = match.status !== "active";
  // Fim por W.O. não aparece no tabuleiro: a tela de fim recebe o motivo.
  const result =
    finished && match.winner && match.endReason && END_REASON[match.endReason]
      ? { winner: match.winner, subMessage: END_REASON[match.endReason][match.winner === match.you ? 0 : 1] }
      : null;
  const awaySeconds = Math.max(0, Math.ceil((ABANDON_MS - opponentAwayMs) / 1000));

  return (
    <div className="relative h-screen w-full">
      <TutorialGateProvider value={myTurn ? null : BOT_TURN_GATE}>
        <GameScreen game={engine} result={result} onExit={() => router.push("/")} />
      </TutorialGateProvider>

      {!finished && opponentAwayMs >= AWAY_WARNING_MS && (
        <div className="pointer-events-none fixed left-1/2 top-16 z-[90] flex -translate-x-1/2 items-center gap-2 rounded-md border border-[#ffb020]/60 bg-black/85 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-[#ffb020]">
          <WifiOff size={14} />
          {match.players[opponent].handle} desconectou · vitória por W.O. em {awaySeconds}s
        </div>
      )}

      {online.error && !finished && (
        <p className="fixed bottom-12 left-3 z-[90] max-w-xs rounded-md bg-red-500/20 px-3 py-1.5 font-mono text-[11px] text-red-200">{online.error}</p>
      )}

      {!finished && (
        <div className="fixed bottom-3 left-3 z-[90] flex items-center gap-2 font-mono">
          {confirmLeave ? (
            <>
              <span className="rounded-md bg-black/80 px-2 py-1.5 text-[11px] text-zinc-200">Sair entrega a vitória ao oponente.</span>
              <button className="rounded-md bg-red-600 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white" onClick={leave}>
                Sair
              </button>
              <button className="rounded-md bg-black/80 px-3 py-1.5 text-[11px] uppercase tracking-widest text-zinc-300" onClick={() => setConfirmLeave(false)}>
                Ficar
              </button>
            </>
          ) : (
            <button
              className="flex items-center gap-1.5 rounded-md bg-black/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-zinc-300 hover:text-white"
              onClick={() => setConfirmLeave(true)}
            >
              <DoorOpen size={13} /> Sair da partida
            </button>
          )}
        </div>
      )}
    </div>
  );
}
